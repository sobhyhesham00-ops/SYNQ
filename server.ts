import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 7. Log requests to console
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // 5. Proper CORS headers for localhost:5173 (dev) and localhost:3000 (prod)
  const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  );

  // 8. JSON body parser middleware with 10mb limit
  app.use(express.json({ limit: "10mb" }));

  // Helper for Gemini using GEMINI_API_KEY from environment variables (4)
  function getAI(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({ apiKey });
  }

  // 3. GET /api/health
  app.get("/api/health", (req, res) => {
    try {
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // 3. POST /api/analyze-schedule
  app.post("/api/analyze-schedule", async (req, res) => {
    try {
      const { schedules } = req.body;
      if (!Array.isArray(schedules)) {
        return res.status(400).json({ error: "Invalid schedule format. Expected an array." });
      }

      const ai = getAI();
      const prompt = `Analyze this scheduling data and provide insights:\n\n${JSON.stringify(schedules, null, 2)}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Error analyzing schedule:", error);
      res.status(500).json({ error: error.message || "Failed to analyze schedule" });
    }
  });

  // 3. POST /api/ai-chat
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const ai = getAI();
      const prompt = `System Context: You are a scheduling assistant.\nEvent Context: ${JSON.stringify(context || {})}\nUser Message: ${message}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });

  // 6. Proper error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // 2. Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware for development...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files for production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 1. Listen on port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
