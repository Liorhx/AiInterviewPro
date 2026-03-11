import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rolePreference: { type: String, default: "Frontend Developer" },
  resumeText: { type: String },
  stats: {
    totalInterviews: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    topics: { type: Map, of: Number, default: {} }
  },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);
