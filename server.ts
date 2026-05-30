import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  app.post("/api/analyze-schedule", async (req, res) => {
    try {
      const { schedules } = req.body;
      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        return res.status(400).json({ error: "No schedule data provided for analysis." });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ analysis: "🧠 **AI Analysis Offline**\n\nThe Gemini API key is not currently configured. However, your scheduling portal is fully operational as a standalone application! Ensure to review the schedules manually for coverage gaps." });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
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
        digestText += `Date: ${date}\n` + shifts.map(val => ` - ${val}`).join("\n") + "\n\n";
      });
      if (digestText.length > 30000) {
        digestText = digestText.substring(0, 30000) + "\n... (truncated)";
      }
      const prompt = `
You are an expert workforce management (WFM) advisor for a high-performance clinical team.
Analyze this roster schedule data and produce a professional, highly encouraging, action-oriented executive analysis.

ROSTER SCHEDULE SUMMARY:
${digestText}

Please structure your response with elegant markdown:
- **📊 Roster Demographics**: Summarize total days scheduled, unique agents on duty, and general coverage density.
- **⚡ Daily Coverage Peak & Lows**: Highlight the specific dates with the lowest coverage vs dates with abundant coverage.
- **🕰️ Shift Balance Analysis**: Assess if morning, evening, night, or weekend coverage has potential gaps or heavy work-concentration.
- **💡 Core WFM Recommendations**: Present 3 discrete, actionable, bulleted recommendations to optimize this scheduling cycle, improve restroom/lunch compliance, and support staff members on heavy duty days.
`;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      const analysis = response.text || "No response generated from the AI.";
      res.json({ analysis });
    } catch (err: any) {
      console.error("Schedule Analysis Error:", err);
      return res.json({ analysis: `🧠 **AI Analysis Currently Unavailable**\n\nThe AI encountered an issue: ${err.message}. \n\nYour portal remains fully operational as a standalone application. Please review the schedules manually for coverage gaps.` });
    }
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Missing message." });
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ reply: "I'm currently offline (API key not configured), but your portal is fully functional as a standalone app! You can manage schedules, requests, and cases without me. 😊" });
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const prompt = `You are a helpful and polite WFM AI scheduling assistant embedded in a team portal. Provide a short, friendly, concise, and helpful response to this agent's query: "${message}"`;
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      res.json({ reply: response.text || "No response generated." });
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      res.json({ reply: `I encountered an issue connecting to the AI: ${err.message}. Your portal functionality remains completely safe and fully standalone! 😊` });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on host 0.0.0.0 on port ${PORT}`);
  });
}

startServer();
fix server
