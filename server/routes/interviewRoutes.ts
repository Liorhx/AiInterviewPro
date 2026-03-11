import express from "express";
import { startSession, getNextQuestion, submitAnswer, getStats, getSession, completeSession, saveQuestionsBatch } from "../controllers/interviewController.ts";
import { auth } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/start", auth, startSession);
router.get("/session/:id", auth, getSession);
router.post("/question", auth, getNextQuestion);
router.post("/questions-batch", auth, saveQuestionsBatch);
router.post("/answer", auth, submitAnswer);
router.post("/complete/:id", auth, completeSession);
router.get("/stats", auth, getStats);

export default router;
