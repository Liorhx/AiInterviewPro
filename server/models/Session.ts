import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  difficulty: { type: String, required: true },
  jobDescription: { type: String },
  questionCount: { type: Number, default: 5 },
  type: { type: String, enum: ["Practice", "Simulation"], default: "Practice" },
  questions: [{
    text: String,
    category: String,
    difficulty: String,
    expectedOutline: String,
    userAnswer: String,
    feedback: {
      rating: Number,
      strengths: [String],
      weaknesses: [String],
      missingConcepts: [String],
      improvedAnswer: String
    }
  }],
  status: { type: String, enum: ["Started", "Completed"], default: "Started" },
  createdAt: { type: Date, default: Date.now }
});

export const Session = mongoose.model("Session", sessionSchema);
