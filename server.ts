import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";

// Firebase imports
import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

// Import our new type-safe validators, loggers & config
import { validateSchedules, validateMessage } from "./src/lib/validators";
import { logger } from "./src/lib/logger";

const GEMINI_MODEL = "gemini-2.0-flash";
const STARTUP_TIME = Date.now();

// Circular Changelog Buffer for Realtime Sync
const changelog: any[] = [];
function pushChange(
  type: "schedule" | "profile",
  action: "create" | "update" | "delete",
  data: any,
) {
  const change = {
    id: Math.random().toString(36).substring(2, 11) + "-" + Date.now(),
    type,
    action,
    data,
    timestamp: Date.now(),
  };
  changelog.push(change);
  if (changelog.length > 100) {
    changelog.shift();
  }
}

// In-memory schedules fallback if Firebase is not active
let inMemorySchedules: any[] = [];

// Initialize Firebase if config exists
let firebaseApp;
let db: any = null;
try {
  let firebaseConfigPath = path.join(
    process.cwd(),
    "config",
    "firebase-applet-config.json",
  );
  if (!fs.existsSync(firebaseConfigPath)) {
    firebaseConfigPath = path.join(
      process.cwd(),
      "firebase-applet-config.json",
    );
  }

  if (fs.existsSync(firebaseConfigPath)) {
    const raw = fs.readFileSync(firebaseConfigPath, "utf8");
    const firebaseConfig = JSON.parse(raw);
    firebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    logger.info(
      "Firebase",
      "Initialized successfully via " + firebaseConfigPath,
    );
  } else {
    logger.warn(
      "Firebase",
      "No config file found, continuing in offline/in-memory fallback mode",
    );
  }
} catch (err: any) {
  logger.warn(
    "Firebase",
    "Initialization failed, continuing with in-memory store",
    err,
  );
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // STEP 5: Add Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // STEP 5: Add CORS with strictly bounded origin
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.APP_URL,
          "http://localhost:3000",
          "http://localhost:5173",
        ].filter(Boolean); // Filter out undefined

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false); // Block other origins quietly, or pass Error
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Add compression (gzip)
  app.use(compression());

  // JSON Body Parser with explicit size limits
  app.use(express.json({ limit: "15mb" }));

  // Request timeout (30 seconds)
  app.use((req, res, next) => {
    req.setTimeout(30000);
    next();
  });

  // Request validation middleware for POST/PUT (must be JSON)
  app.use((req, res, next) => {
    if (["POST", "PUT"].includes(req.method)) {
      if (!req.is("application/json")) {
        return res
          .status(400)
          .json({ error: "Content-Type must be application/json" });
      }
    }
    next();
  });

  // Error logging and Request monitoring middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith("/api") || res.statusCode >= 400) {
        logger.info(
          "HTTP",
          `${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`,
        );
      }
    });
    next();
  });

  // Proceed to routes

  // Rate Limiting on API routes
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many requests from this IP",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV !== "production",
  });
  app.use("/api/", limiter);

  // Helper to safely extract text from a Gemini response
  function safeText(
    response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>,
  ): string {
    try {
      return response.text ?? "";
    } catch {
      return "";
    }
  }

  function getAI(): { ai: GoogleGenAI; apiKey: string } | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
    return { ai, apiKey };
  }

  // STEP 6: Health check endpoint (before Vite middleware)
  app.get("/health", (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    const isConfigured = !!key && key !== "MY_GEMINI_API_KEY";
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      apiKeyConfigured: isConfigured,
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // STEP 6: Status API endpoint
  app.get("/api/status", (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
      },
      uptime: Math.round(process.uptime()) + "s",
      node_version: process.version,
      platform: process.platform,
    });
  });

  // ─── API: AI Schedule Roster Analyzer ────────────────────────────────────────
  app.post("/api/analyze-schedule", async (req, res) => {
    const startMs = Date.now();
    try {
      // Validate input - handle both direct array and nested schedules array
      const payload = Array.isArray(req.body)
        ? req.body
        : req.body.schedules || [];
      const validation = validateSchedules(payload);
      if (!validation.valid) {
        return res
          .status(422)
          .json({ error: "Validation failed", details: validation.errors });
      }

      const schedules = validation.data || [];
      logger.info("Schedule", "Request received", {
        schedulesCount: schedules.length,
      });

      const genai = getAI();
      if (!genai) {
        logger.warn("AI", "Analyze schedule requested but AI offline");
        return res.status(401).json({
          error: "API key validation failed",
          message:
            "The Gemini API key is missing or invalid. Please configure it in settings.",
        });
      }

      // Format schedule items into compact summary
      const summaryMap: Record<string, string[]> = {};
      schedules.forEach((s) => {
        const d = s.date || "Unknown Date";
        const agent = s.agentName || "Unknown Agent";
        const shift = s.shiftLabel || "Unknown Shift";
        if (!summaryMap[d]) summaryMap[d] = [];
        summaryMap[d].push(`${agent} (${shift})`);
      });

      let digestText = "";
      Object.entries(summaryMap)
        .sort()
        .forEach(([date, shifts]) => {
          digestText +=
            `Date: ${date}\n` +
            shifts.map((val) => `  - ${val}`).join("\n") +
            "\n\n";
        });

      if (digestText.length > 30000) {
        digestText = digestText.substring(0, 30000) + "\n... (truncated)";
      }

      const prompt = `
You are an expert workforce management (WFM) advisor for a high-performance clinical team.
Analyze this roster schedule data and produce a professional, highly encouraging, action-oriented executive analysis.

ROSTER SCHEDULE SUMMARY:
${digestText}

Structure your response with elegant markdown:
- **📊 Roster Demographics**: Summarize total days scheduled, unique agents on duty, and general coverage density.
- **⚡ Daily Coverage Peak & Lows**: Highlight specific dates with lowest coverage vs abundant coverage.
- **🕰️ Shift Balance Analysis**: Assess if morning, evening, night, or weekend coverage has potential gaps or heavy work-concentration.
- **💡 Core WFM Recommendations**: Present 3 discrete, actionable, bulleted recommendations to optimize this scheduling cycle, improve restroom/lunch compliance, and support staff members on heavy duty days.
`;

      logger.info("Gemini", "API call", { model: GEMINI_MODEL });
      const response = await genai.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const analysis =
        safeText(response) || "No response generated from the AI.";
      logger.info("Schedule", "Analysis complete", {
        duration: Date.now() - startMs + "ms",
      });
      return res.json({ analysis });
    } catch (err: any) {
      logger.error("Schedule", "Analysis error", err);
      return res.json({
        analysis: `🧠 **AI Analysis Currently Unavailable**\n\nThe AI encountered an issue: ${err instanceof Error ? err.message : "Unknown"}.\n\nYour portal remains fully operational as a standalone application. Please review schedules manually for coverage gaps.`,
      });
    }
  });

  // ─── API: AI General Assistant Chat ──────────────────────────────────────────
  app.post("/api/ai-chat", async (req, res) => {
    const startMs = Date.now();
    try {
      const validation = validateMessage(req.body.message);
      if (!validation.valid) {
        return res
          .status(422)
          .json({ error: "Validation failed", details: validation.errors });
      }

      const message = validation.data || "";
      const knowledgeContext = req.body.knowledgeContext;

      logger.info("Chat", "Message received", { length: message.length });

      const genai = getAI();
      if (!genai) {
        logger.warn("AI", "Chat requested but AI offline");
        return res.status(401).json({
          error: "API key validation failed",
          message:
            "The Gemini API key is missing or invalid. Please configure it in settings.",
        });
      }

      let prompt = `You are a helpful and polite WFM AI scheduling assistant embedded in a team portal.`;
      if (
        knowledgeContext &&
        typeof knowledgeContext === "string" &&
        knowledgeContext.trim()
      ) {
        prompt += `\n\nUse the following relevant Knowledge Base context to answer the user's query if it helps:\n${knowledgeContext}\n`;
      }
      prompt += `\nProvide a short, friendly, concise, and helpful response to this agent's query: "${message}"`;

      logger.info("Gemini", "Chat API call", { model: GEMINI_MODEL });
      const response = await genai.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      logger.info("Chat", "Reply generated", {
        duration: Date.now() - startMs + "ms",
      });
      return res.json({
        reply: safeText(response) || "No response generated.",
      });
    } catch (err: any) {
      logger.error("Chat", "Error", err);
      return res.json({
        reply: `I encountered an issue connecting to the AI: ${err instanceof Error ? err.message : "Unknown"}. Your portal functionality remains completely safe and fully standalone! 😊`,
      });
    }
  });

  // ─── PARTIAL SYNC SYSTEM /api/sync ─────────────────────────────────────────
  app.post("/api/sync", async (req, res) => {
    const items = req.body.items || [];
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const item of items) {
      try {
        if (item.type === "schedule") {
          if (item.action === "create") {
            const dataItem = item.data;
            if (db) {
              await addDoc(collection(db, "schedules"), {
                ...dataItem,
                archived: false,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
              });
            } else {
              const newId =
                "local-" +
                Date.now() +
                Math.random().toString(36).substring(2, 6);
              inMemorySchedules.push({
                id: newId,
                archived: false,
                ...dataItem,
              });
            }
            pushChange("schedule", "create", dataItem);
          } else if (item.action === "update") {
            const dataItem = item.data;
            if (db) {
              await setDoc(
                doc(db, "schedules", dataItem.id),
                {
                  ...dataItem,
                  updatedAt: Timestamp.now(),
                },
                { merge: true },
              );
            } else {
              inMemorySchedules = inMemorySchedules.map((s) =>
                s.id === dataItem.id ? { ...s, ...dataItem } : s,
              );
            }
            pushChange("schedule", "update", dataItem);
          } else if (item.action === "delete") {
            const id = item.data.id;
            if (db) {
              await updateDoc(doc(db, "schedules", id), {
                archived: true,
                deletedAt: Timestamp.now(),
              });
            } else {
              inMemorySchedules = inMemorySchedules.map((s) =>
                s.id === id ? { ...s, archived: true } : s,
              );
            }
            pushChange("schedule", "delete", { id });
          }
        }
        results[item.id] = { success: true };
      } catch (err: any) {
        logger.error("Sync", "Failed processing sync item " + item.id, err);
        results[item.id] = {
          success: false,
          error: err.message || "Processing failed",
        };
      }
    }

    res.json({ results });
  });

  // ─── API: REAL-TIME CLIENT CHANGES ENDPOINT ────────────────────────────────
  app.get("/api/changes", (req, res) => {
    res.json({ changes: changelog });
  });

  // ─── API: SCHEDULES RESOURCE ENDPOINTS (STEP 9) ───────────────────────────
  app.post("/api/schedules", async (req, res) => {
    try {
      const validation = validateSchedules([req.body]);
      if (!validation.valid) {
        return res
          .status(422)
          .json({ error: "Validation failed", details: validation.errors });
      }

      const valItem = (validation.data || [])[0];
      const resItem = { ...valItem, archived: false };

      if (db) {
        const docRef = await addDoc(collection(db, "schedules"), {
          ...resItem,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        const saved = { id: docRef.id, ...resItem };
        pushChange("schedule", "create", saved);
        res.json(saved);
      } else {
        const localId = "local-" + Math.random().toString(36).substring(2, 9);
        const saved = { id: localId, ...resItem };
        inMemorySchedules.push(saved);
        pushChange("schedule", "create", saved);
        res.json(saved);
      }
    } catch (err: any) {
      logger.error("Schedules", "Create error", err);
      res.status(500).json({ error: "Failed to create" });
    }
  });

  app.get("/api/schedules", async (req, res) => {
    try {
      if (db) {
        const q = query(
          collection(db, "schedules"),
          where("archived", "==", false),
        );
        const querySnapshot = await getDocs(q);
        const schedules = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        res.json({ schedules });
      } else {
        res.json({ schedules: inMemorySchedules.filter((s) => !s.archived) });
      }
    } catch (err: any) {
      logger.error("Schedules", "Fetch error", err);
      res.status(500).json({ error: "Failed to fetch" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const validation = validateSchedules([req.body]);
      if (!validation.valid) {
        return res
          .status(422)
          .json({ error: "Validation failed", details: validation.errors });
      }

      const valItem = (validation.data || [])[0];
      const id = req.params.id;

      if (db) {
        const ref = doc(db, "schedules", id);
        await setDoc(
          ref,
          {
            ...valItem,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        );
        const updated = { id, ...valItem };
        pushChange("schedule", "update", updated);
        res.json(updated);
      } else {
        inMemorySchedules = inMemorySchedules.map((s) =>
          s.id === id ? { ...s, ...valItem } : s,
        );
        const updated = { id, ...valItem };
        pushChange("schedule", "update", updated);
        res.json(updated);
      }
    } catch (err: any) {
      logger.error("Schedules", "Update error", err);
      res.status(500).json({ error: "Failed to update" });
    }
  });

  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (db) {
        const ref = doc(db, "schedules", id);
        await updateDoc(ref, {
          archived: true,
          deletedAt: Timestamp.now(),
        });
        pushChange("schedule", "delete", { id });
        res.json({ success: true });
      } else {
        inMemorySchedules = inMemorySchedules.map((s) =>
          s.id === id ? { ...s, archived: true } : s,
        );
        pushChange("schedule", "delete", { id });
        res.json({ success: true });
      }
    } catch (err: any) {
      logger.error("Schedules", "Delete error", err);
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ─── API: Weather Proxy ────────────────────────────────────────────────────
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat = "30.30", lng = "31.75" } = req.query;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      logger.warn("API", "Weather proxy used fallback");
      res
        .status(502)
        .json({ error: "Failed to fetch weather", is_fallback: true });
    }
  });

  // ─── Vite dev middleware / production static serving ─────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handling Middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      logger.error(
        "SERVER_ERROR",
        `Unhandled error on ${req.method} ${req.url}`,
        err,
      );
      res.status(err.status || 500).json({
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "An unexpected error occurred",
      });
    },
  );

  app.listen(PORT, "0.0.0.0", () => {
    logger.info("Server", `Started on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error("STARTUP", "Failed to start server", err);
  process.exit(1);
});
