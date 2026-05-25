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
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
    return { ai, apiKey };
  }

  function safeText(response: any): string {
    try {
      return response.text ?? "";
    } catch {
      return "";
    }
  }

  app.post("/api/analyze-schedule", async (req, res) => {
    try {
      const { schedules } = req.body;

      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ error: "No schedule data provided for analysis." });
      }

      const genai = getAI();
      if (!genai) {
        return res.json({
          analysis: "🧠 **AI Analysis Offline**\n\nThe Gemini API key is not configured. Your scheduling portal is fully operational as a standalone application — review schedules manually for coverage gaps.",
        });
      }

      const summaryMap: Record<string, string[]> = {};
      schedules.forEach((s: any) => {
        const d = s.date || "Unknown Date";
        const agent = s.agentName || "Unknown Agent";
        const shift = s.shiftLabel || "Unknown Shift";
        if (!summaryMap[d]) summaryMap[d] = [];
        summaryMap[d].push(`${agent} (${shift})`);
      });

      let digestText = "";
      Object.entries(summaryMap).sort().forEach(([date, shifts]) => {
        digestText += `Date: ${date}\n` + shifts.map((val) => `  - ${val}`).join("\n") + "\n\n";
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

      const response = await genai.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      const analysis = safeText(response) || "No response generated from the AI.";
      return res.json({ analysis });
    } catch (err: any) {
      console.error("Schedule Analysis Error:", err);
      return res.json({
        analysis: `🧠 **AI Analysis Currently Unavailable**\n\nThe AI encountered an issue: ${err.message}.\n\nYour portal remains fully operational as a standalone application.`,
      });
    }
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing or invalid message." });
      }

      const genai = getAI();
      if (!genai) {
        return res.json({
          reply: "I'm currently offline (API key not configured), but your portal is fully functional as a standalone app! 😊",
        });
      }

      const prompt = `You are a helpful and polite WFM AI scheduling assistant embedded in a team portal. Provide a short, friendly, concise, and helpful response to this agent's query: "${message.substring(0, 2000)}"`;

      const response = await genai.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      return res.json({ reply: safeText(response) || "No response generated." });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      return res.json({
        reply: `I encountered an issue connecting to the AI: ${err.message}. Your portal functionality remains completely standalone! 😊`,
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
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
