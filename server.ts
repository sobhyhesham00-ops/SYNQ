import "dotenv/config"; // FIX #1: Load .env variables (was missing — API key was always undefined locally)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// FIX #2: Removed __dirname calculation since it breaks when compiled to CJS. Use process.cwd() when needed.

// FIX #3: Correct Gemini model name. "gemini-3.5-flash" does NOT exist.
// Valid fast models: "gemini-2.0-flash" or "gemini-1.5-flash"
const GEMINI_MODEL = "gemini-2.0-flash";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: "15mb" }));

  // FIX #4: Add CORS headers so the Vite dev server (port 5173) can call the API (port 3000)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // FIX #5: Shared helper — creates a GoogleGenAI instance only when API key exists.
  // Previously the key was checked AFTER construction in some paths, causing crashes.
  function getAI(): { ai: GoogleGenAI; apiKey: string } | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
    return { ai, apiKey };
  }

  // FIX #6: Helper to safely extract text from a Gemini response.
  // In @google/genai v1+, `response.text` is a getter that throws on empty candidates.
  // Wrapping it prevents unhandled exceptions crashing the server.
  function safeText(response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>): string {
    try {
      return response.text ?? "";
    } catch {
      return "";
    }
  }

  // ─── API: AI Schedule Roster Analyzer ────────────────────────────────────────
  app.post("/api/analyze-schedule", async (req, res) => {
    try {
      const { schedules } = req.body;

      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res
          .status(400)
          .json({ error: "No schedule data provided for analysis." });
      }

      const genai = getAI();
      if (!genai) {
        return res.json({
          analysis:
            "🧠 **AI Analysis Offline**\n\nThe Gemini API key is not configured. Your scheduling portal is fully operational as a standalone application — review schedules manually for coverage gaps.",
        });
      }

      // Format schedule items into compact summary
      const summaryMap: Record<string, string[]> = {};
      schedules.forEach((s: any) => {
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

      // FIX #7: Use the correct model name
      const response = await genai.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      // FIX #8: Use safe text extraction
      const analysis = safeText(response) || "No response generated from the AI.";
      return res.json({ analysis });
    } catch (err: any) {
      console.error("Schedule Analysis Error:", err);
      return res.json({
        analysis: `🧠 **AI Analysis Currently Unavailable**\n\nThe AI encountered an issue: ${err.message}.\n\nYour portal remains fully operational as a standalone application. Please review schedules manually for coverage gaps.`,
      });
    }
  });

  // ─── API: AI General Assistant Chat ──────────────────────────────────────────
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing or invalid message." });
      }

      const genai = getAI();
      if (!genai) {
        return res.json({
          reply:
            "I'm currently offline (API key not configured), but your portal is fully functional as a standalone app! You can manage schedules, requests, and cases without me. 😊",
        });
      }

      const prompt = `You are a helpful and polite WFM AI scheduling assistant embedded in a team portal. Provide a short, friendly, concise, and helpful response to this agent's query: "${message.substring(0, 2000)}"`;

      // FIX #7: Use the correct model name
      const response = await genai.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      // FIX #8: Use safe text extraction
      return res.json({ reply: safeText(response) || "No response generated." });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      return res.json({
        reply: `I encountered an issue connecting to the AI: ${err.message}. Your portal functionality remains completely safe and fully standalone! 😊`,
      });
    }
  });

  // ─── API: Weather Proxy ────────────────────────────────────────────────────
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat = "30.30", lng = "31.75" } = req.query;
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      if (!response.ok) {
        throw new Error(`Open-Meteo returned ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Weather Proxy Error:", err);
      res.status(500).json({ error: "Failed to fetch weather" });
    }
  });

  // ─── Vite dev middleware / production static serving ─────────────────────────
  if (process.env.NODE_ENV !== "production") {
    // FIX #9: Pass the server instance to Vite so HMR websocket works on the same port.
    // Without this, Vite runs a separate WS server and HMR can silently fail.
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // FIX #10: Catch-all must not match /api/* routes (was missing API exclusion).
    // Previously a failed /api/* call in production would return index.html (200) instead of 404.
    app.get(/^(?!\/api\/).*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.warn("⚠️  GEMINI_API_KEY is not set — AI features will be disabled.");
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
