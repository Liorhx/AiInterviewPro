import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Trophy, Target, Clock, TrendingUp, ChevronRight, BookOpen, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import * as gemini from "../services/geminiService.ts";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/interview/stats");
        setStats(res.data);
        
        if (res.data.sessions && res.data.sessions.length > 0) {
          setAnalyzing(true);
          try {
            const aiAnalysis = await gemini.analyzePerformance(res.data.sessions);
            setAnalysis(aiAnalysis);
          } catch (err) {
            console.error("AI Analysis failed:", err);
          } finally {
            setAnalyzing(false);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 rounded-full bg-indigo-100 mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Your Progress</h1>
          <p className="mt-2 text-neutral-600">Track your interview performance and skill growth.</p>
        </div>
        <Link
          to="/roles"
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-indigo-700 transition-all"
        >
          Start New Practice
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Interviews", value: stats?.total || 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Average Score", value: `${stats?.avgScore || 0}/10`, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Practice Hours", value: `${(stats?.total * 0.5).toFixed(1)}h`, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Success Rate", value: `${Math.min(100, (stats?.avgScore * 10)).toFixed(0)}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -5 }}
            className="rounded-3xl bg-white p-8 shadow-lg border border-black/5"
          >
            <div className={`inline-flex rounded-2xl p-3 ${stat.bg} ${stat.color} mb-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-neutral-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Analysis Section */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" /> AI Performance Insights
          </h2>
          {analyzing && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Updating analysis...
            </div>
          )}
        </div>

        {analysis ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Score Trend */}
            <div className="lg:col-span-2 rounded-3xl bg-white p-8 shadow-lg border border-black/5">
              <h3 className="text-lg font-bold text-neutral-900 mb-8">Score Trend</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ fill: "#4f46e5", r: 6 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-3xl bg-white p-8 shadow-lg border border-black/5">
              <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" /> Personalized Recommendations
              </h3>
              <div className="space-y-4">
                {analysis.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex gap-3 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 border border-indigo-100">
                    <Sparkles className="h-5 w-5 shrink-0 text-indigo-600" />
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="rounded-3xl bg-white p-8 shadow-lg border border-black/5">
              <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Key Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.strengths.map((s: string, i: number) => (
                  <span key={i} className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 border border-emerald-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl bg-white p-8 shadow-lg border border-black/5">
              <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" /> Areas for Improvement
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {analysis.weakTopics.map((topic: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-black/5 p-4">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="font-bold text-neutral-800">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-12 text-center border border-dashed border-neutral-300">
            <Sparkles className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-xl font-bold text-neutral-900">No Analysis Available Yet</h3>
            <p className="mt-2 text-neutral-500">Complete a few more interviews to unlock AI-powered performance insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}
