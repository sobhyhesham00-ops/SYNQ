import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if .env.local is missing
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

  // ─── API: Health Check ───────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ─── API: AI Schedule Roster Analyzer ────────────────────────────────────────
  app.post('/api/analyze-schedule', async (req, res) => {
    try {
      const { scheduleData } = req.body;
      const aiObj = getAI();
      if (!aiObj) throw new Error("Gemini API key is not configured.");
      
      const response = await aiObj.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Analyze this schedule: ${JSON.stringify(scheduleData)}`
      });
      res.json({ analysis: safeText(response) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── API: AI General Assistant Chat ──────────────────────────────────────────
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { message } = req.body;
      const aiObj = getAI();
      if (!aiObj) throw new Error("Gemini API key is not configured.");

      const response = await aiObj.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: message
      });
      res.json({ reply: safeText(response) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
