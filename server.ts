import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GEMINI_MODEL = "gemini-2.0-flash";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: "15mb" }));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  function getAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") return null;
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
    return { ai };
  }

  function safeText(response: any): string {
    try { return response.text ?? ""; } catch { return ""; }
  }

  app.post("/api/analyze-schedule", async (req, res) => {
    try {
      const { schedules } = req.body;
      if (!schedules || !Array.isArray(schedules) || schedules.length === 0)
        return res.status(400).json({ error: "No schedule data provided." });

      const genai = getAI();
      if (!genai) return res.json({ analysis: "🧠 **AI Offline** — API key not configured. Portal works standalone." });

      const summaryMap: Record<string, string[]> = {};
      schedules.forEach((s: any) => {
        const d = s.date || "Unknown Date";
        if (!summaryMap[d]) summaryMap[d] = [];
        summaryMap[d].push(`${s.agentName || "Unknown"} (${s.shiftLabel || "Unknown"})`);
      });

      let digestText = "";
      Object.entries(summaryMap).sort().forEach(([date, shifts]) => {
        digestText += `Date: ${date}\n` + shifts.map(v => `  - ${v}`).join("\n") + "\n\n";
      });
      if (digestText.length > 30000) digestText = digestText.substring(0, 30000) + "\n... (truncated)";

      const prompt = `You are an expert WFM advisor. Analyze this roster and respond with markdown covering: 📊 Roster Demographics, ⚡ Coverage Peaks & Lows, 🕰️ Shift Balance, 💡 3 Recommendations.\n\nROSTER:\n${digestText}`;
      const response = await genai.ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
      return res.json({ analysis: safeText(response) || "No response generated." });
    } catch (err: any) {
      console.error("Schedule Analysis Error:", err);
      return res.json({ analysis: `🧠 AI unavailable: ${err.message}. Portal works standalone.` });
    }
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string")
        return res.status(400).json({ error: "Missing or invalid message." });

      const genai = getAI();
      if (!genai) return res.json({ reply: "I'm offline (no API key) but your portal works standalone! 😊" });

      const prompt = `You are a helpful WFM scheduling assistant. Answer this briefly and helpfully: "${message.substring(0, 2000)}"`;
      const response = await genai.ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
      return res.json({ reply: safeText(response) || "No response generated." });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      return res.json({ reply: `AI error: ${err.message}. Portal still works standalone! 😊` });
    }
  });

  app.get("/api/weather", async (req, res) => {
    try {
      const lat = Number.parseFloat(typeof req.query.lat === "string" ? req.query.lat : "30.30");
      const lng = Number.parseFloat(typeof req.query.lng === "string" ? req.query.lng : "31.75");

      if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
          !Number.isFinite(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Invalid latitude or longitude." });
      }

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lng));
      url.searchParams.set("current_weather", "true");
