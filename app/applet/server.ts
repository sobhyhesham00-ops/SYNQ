import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // fallback to .env if .env.local is missing

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// 1. Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 2. CORS headers
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "*";
  if (origin.includes("localhost:5173") || origin.includes("localhost:3000")) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// 3. JSON body parser with 10mb limit
app.use(express.json({ limit: "10mb" }));

// Helper function to initialize Gemini API client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY environment variable is not set or invalid.");
  }
  return new GoogleGenAI({ apiKey });
};

const GEMINI_MODEL = "gemini-2.5-flash";

// --- API Endpoints ---

// GET /api/health
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/api/log-nan", (req: Request, res: Response) => {
  const fs = require('fs');
  fs.writeFileSync('nan_error.txt', req.body.stack || 'no stack');
  console.log("=== NAN ERROR CAUGHT ===");
  res.json({ status: "logged" });
});

// POST /api/analyze-schedule
app.post("/api/analyze-schedule", async (req: Request, res: Response) => {
  try {
    const { schedules } = req.body;
    
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "Invalid or empty schedules provided." });
    }

    const ai = getGeminiClient();
    
    const scheduleText = schedules.map(s => 
      `- ${s.date || 'Unknown Date'}: ${s.agentName || 'Unknown Agent'} (${s.shiftLabel || 'Unknown Shift'})`
    ).join('\n');

    const prompt = `Please analyze the following shift schedules and provide an executive summary. Focus on coverage gaps, peak and low distributions, shift balance, and provide 3 actionable WFM recommendations:
\n${scheduleText}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const analysis = response.text || "No analysis could be generated.";
    res.json({ analysis });

  } catch (error: any) {
    console.error("Error in /api/analyze-schedule:", error);
    res.status(500).json({ error: error.message || "An error occurred during schedule analysis.", analysis: `Analysis currently unavailable due to an error: ${error.message}` });
  }
});

// POST /api/ai-chat
app.post("/api/ai-chat", async (req: Request, res: Response) => {
  try {
    const { message, context, knowledgeContext } = req.body; // Check for both variations of context

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid message." });
    }

    const ai = getGeminiClient();

    let prompt = "You are a helpful scheduling assistant. Please answer the user's query.\n";
    const ctx = context || knowledgeContext;
    if (ctx) {
      prompt += `Context to consider:\n${ctx}\n`;
    }
    prompt += `\nUser: ${message}`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const reply = response.text || "No response generated.";
    res.json({ response: reply, reply });
    
  } catch (error: any) {
    console.error("Error in /api/ai-chat:", error);
    res.status(500).json({ error: error.message || "An error occurred during chat.", reply: `Chat currently unavailable due to an error: ${error.message}` });
  }
});

// --- Vite Middleware and Static File Serving ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode: setup vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files appropriately
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(/^(?!\/api\/).*/, (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.warn("⚠️  GEMINI_API_KEY is not set — AI features will fail.");
    }
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
