import { Request, Response, NextFunction } from "express";
import { IScheduleItem, IAiChatRequest, IAnalyzeRequest } from "./types";

export const validateScheduleInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schedules } = req.body as Partial<IAnalyzeRequest>;
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ error: "schedules", message: "No schedule data provided for analysis or not an array." });
    }

    // validate format
    for (const s of schedules) {
      if (!s.date || !s.agentName || !s.shiftLabel) {
        return res.status(400).json({ error: "schedules", message: "Each schedule item must contain date, agentName, and shiftLabel." });
      }
    }
    next();
  } catch (error) {
    res.status(400).json({ error: "invalid_input", message: "Failed to validate schedule input" });
  }
};

export const validateChatInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body as Partial<IAiChatRequest>;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: "message", message: "Message is required and must be a non-empty string." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "message", message: "Message exceeds 2000 characters." });
    }
    next();
  } catch (error) {
    res.status(400).json({ error: "invalid_input", message: "Failed to validate chat input" });
  }
};

export const validateJsonSize = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: "payload_too_large", message: "Payload exceeds 15mb limit." });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: "invalid_json", message: "Malformed JSON payload." });
  }
  next(err);
};
