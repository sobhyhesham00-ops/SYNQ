import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function startServer() {
  app.set("trust proxy", 1);

  // 4. CORS and Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true, // Allow all for local dev, restrict in prod
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "15mb" }));

  // Helper for Gemini
  function getAI(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") return null;
    return new GoogleGenAI({ apiKey });
  }

  // 3. GET /health
  app.get("/health", (req, res) => {
    const ai = getAI();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      aiConfigured: !!ai,
    });
  });

  // 1. POST /api/analyze-schedule
  app.post("/api/analyze-schedule", async (req, res, next) => {
    try {
      const { schedules } = req.body;
      if (!Array.isArray(schedules)) {
        return res.status(400).json({ error: "'schedules' must be an array" });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured or invalid." });
      }

      const scheduleData = JSON.stringify(schedules, null, 2);
      const prompt = `Analyze this roster schedule data and produce a professional, highly encouraging, action-oriented executive analysis.

ROSTER SCHEDULE SUMMARY:
${scheduleData}

Structure your response evaluating coverage peak and lows, shift balance, and WFM recommendations.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error) {
      next(error);
    }
  });

  // 2. POST /api/ai-chat
  app.post("/api/ai-chat", async (req, res, next) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "'message' must be a string" });
      }

      const ai = getAI();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API key is not configured or invalid." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a helpful and polite WFM AI scheduling assistant. Respond to this user query: "${message}"`,
      });

      res.json({ reply: response.text });
    } catch (error) {
      next(error);
    }
  });

  // 5. Proper error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
    });
  });

  // 6. Static file serving for React build & Vite middleware
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
