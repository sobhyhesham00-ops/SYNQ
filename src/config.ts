import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
};

export const STARTUP_TIME = Date.now();

export function validateConfig() {
  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    // We don't throw to allow standalone mode, just warn
    console.warn("⚠️  GEMINI_API_KEY is not set or invalid. AI features will be disabled.");
  }
  
  console.log("=== APP CONFIGURATION ===");
  console.log("NODE_ENV: " + config.NODE_ENV);
  console.log("APP_URL: " + config.APP_URL);
  console.log("PORT: " + config.PORT);
  console.log("AI KEY CONFIG: " + (config.GEMINI_API_KEY ? "Loaded" : "Missing"));
  console.log("=========================");
}
