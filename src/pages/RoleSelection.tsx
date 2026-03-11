import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "motion/react";
import { Code2, Database, Layout, Server, Terminal, ChevronRight } from "lucide-react";

const roles = [
  { id: "frontend", name: "Frontend Developer", icon: Layout, color: "bg-blue-50 text-blue-600" },
  { id: "backend", name: "Backend Developer", icon: Server, color: "bg-green-50 text-green-600" },
  { id: "mern", name: "MERN Stack Developer", icon: Code2, color: "bg-purple-50 text-purple-600" },
  { id: "java", name: "Java Developer", icon: Terminal, color: "bg-red-50 text-red-600" },
  { id: "dsa", name: "Data Structures & Algorithms", icon: Database, color: "bg-orange-50 text-orange-600" },
];

const difficulties = [
  { id: "Easy", label: "Easy", description: "For beginners or practice basic concepts" },
  { id: "Medium", label: "Medium", description: "Moderate difficulty, realistic interview level" },
  { id: "Hard", label: "Hard", description: "Challenging, advanced, system design & coding" },
];

const modes = [
  { id: "Practice", label: "Practice", description: "No timer, user can take their time." },
  { id: "Simulation", label: "Simulation", description: "Timer per question, auto progression, realistic interview feel." },
];

const questionCounts = [
  { value: 5, label: "5 Questions", description: "Short practice session (~15–20 min)" },
  { value: 10, label: "10 Questions", description: "Standard session (~30–40 min)" },
  { value: 15, label: "15 Questions", description: "Full interview simulation (~60–90 min)" },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType] = useState("Practice");
  const [questionCount, setQuestionCount] = useState(5);
  const [jobDescription, setJobDescription] = useState("");
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selectedRole) return;
    try {
      const res = await axios.post("/api/interview/start", {
        role: selectedRole,
        difficulty,
        type,
        questionCount,
        jobDescription
      });
      navigate(`/interview/${res.data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Choose Your Path</h1>
        <p className="mt-4 text-lg text-neutral-600">Select a role and difficulty level to begin your interview session.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.name)}
            className={`group relative flex flex-col items-center rounded-3xl border p-8 transition-all hover:shadow-lg ${
              selectedRole === role.name
                ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600"
                : "border-black/5 bg-white hover:border-indigo-200"
            }`}
          >
            <div className={`rounded-2xl p-4 ${role.color}`}>
              <role.icon className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-neutral-900">{role.name}</h3>
          </button>
        ))}
      </div>

      {selectedRole && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 space-y-8 rounded-3xl bg-white p-8 shadow-xl border border-black/5"
        >
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Difficulty</label>
              <div className="mt-4 space-y-3">
                {difficulties.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`w-full rounded-2xl p-4 text-left transition-all border ${
                      difficulty === d.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                        : "bg-white text-neutral-600 border-black/5 hover:border-indigo-200"
                    }`}
                  >
                    <div className="font-bold">{d.label}</div>
                    <div className={`text-xs mt-1 ${difficulty === d.id ? "text-indigo-100" : "text-neutral-400"}`}>
                      {d.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Mode</label>
              <div className="mt-4 space-y-3">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setType(m.id)}
                    className={`w-full rounded-2xl p-4 text-left transition-all border ${
                      type === m.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                        : "bg-white text-neutral-600 border-black/5 hover:border-indigo-200"
                    }`}
                  >
                    <div className="font-bold">{m.label}</div>
                    <div className={`text-xs mt-1 ${type === m.id ? "text-indigo-100" : "text-neutral-400"}`}>
                      {m.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Number of Questions</label>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {questionCounts.map((qc) => (
                <button
                  key={qc.value}
                  onClick={() => setQuestionCount(qc.value)}
                  className={`rounded-2xl p-4 text-left transition-all border ${
                    questionCount === qc.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                      : "bg-white text-neutral-600 border-black/5 hover:border-indigo-200"
                  }`}
                >
                  <div className="font-bold">{qc.label}</div>
                  <div className={`text-xs mt-1 ${questionCount === qc.value ? "text-indigo-100" : "text-neutral-400"}`}>
                    {qc.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-neutral-500">Job Description (Optional)</label>
            <p className="text-xs text-neutral-400 mt-1 mb-3">Paste the job description to get tailored questions for a specific role and company.</p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description, required skills, and company name here..."
              className="w-full rounded-2xl border border-black/5 p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all min-h-[120px]"
            />
          </div>

          <button
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-5 text-lg font-bold text-white shadow-xl hover:bg-indigo-700 transition-all"
          >
            Start Interview
            <ChevronRight className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
