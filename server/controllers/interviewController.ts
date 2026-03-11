import { Request, Response } from "express";
import { Session } from "../models/Session.ts";
import { User } from "../models/User.ts";

export const startSession = async (req: any, res: Response) => {
  try {
    const { role, difficulty, type, questionCount, jobDescription } = req.body;
    const session = new Session({
      userId: req.user.id,
      role,
      difficulty,
      type,
      questionCount,
      jobDescription
    });
    await session.save();
    res.status(201).json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNextQuestion = async (req: any, res: Response) => {
  try {
    const { sessionId, question } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.questions.push(question);
    await session.save();

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const saveQuestionsBatch = async (req: any, res: Response) => {
  try {
    const { sessionId, questions } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.questions = questions;
    await session.save();

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const submitAnswer = async (req: any, res: Response) => {
  try {
    const { sessionId, answer, feedback } = req.body;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const currentQuestion = session.questions[session.questions.length - 1];
    currentQuestion.userAnswer = answer;
    currentQuestion.feedback = feedback;
    
    await session.save();
    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSession = async (req: any, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const completeSession = async (req: any, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    session.status = "Completed";
    await session.save();
    res.json({ message: "Session completed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStats = async (req: any, res: Response) => {
  try {
    const sessions = await Session.find({ userId: req.user.id, status: "Completed" }).sort({ createdAt: 1 });
    const total = sessions.length;
    const avg = sessions.reduce((acc, s) => {
      const sessionAvg = s.questions.reduce((a, q) => a + (q.feedback?.rating || 0), 0) / (s.questions.length || 1);
      return acc + sessionAvg;
    }, 0) / (total || 1);

    res.json({ total, avgScore: avg.toFixed(1), sessions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
