import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Send, Loader2, CheckCircle, AlertCircle, ArrowRight, Timer } from "lucide-react";
import * as gemini from "../services/geminiService.ts";
import { useAuth } from "../context/AuthContext.tsx";

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const [questionCount, setQuestionCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`/api/interview/session/${sessionId}`);
        setSessionData(res.data);
        
        // If it's a new session with no questions, generate a batch
        if (res.data.questions.length === 0) {
          setLoading(true);
          try {
            const batch = await gemini.generateQuestionsBatch(
              res.data.role,
              res.data.difficulty,
              res.data.questionCount,
              user?.resumeText,
              res.data.jobDescription
            );
            
            const savedRes = await axios.post("/api/interview/questions-batch", {
              sessionId,
              questions: batch
            });
            
            setSessionData(savedRes.data);
            setQuestion(savedRes.data.questions[0]);
            speak(savedRes.data.questions[0].text);
          } catch (err: any) {
            setError("Failed to generate questions. Please try again.");
          } finally {
            setLoading(false);
          }
        } else {
          // Resume session logic
          const questions = res.data.questions;
          const lastAnsweredIndex = questions.findLastIndex((q: any) => q.userAnswer);
          
          if (lastAnsweredIndex === -1) {
            // No questions answered yet
            setQuestion(questions[0]);
            setQuestionCount(1);
          } else if (lastAnsweredIndex < questions.length - 1) {
            // Move to next unanswered question
            setQuestion(questions[lastAnsweredIndex + 1]);
            setQuestionCount(lastAnsweredIndex + 2);
          } else {
            // All questions answered
            setQuestion(questions[questions.length - 1]);
            setQuestionCount(questions.length);
            // If the last one has feedback, we should probably show it or finish
            // For now, just show the last one
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load session details.");
      }
    };
    init();
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Timer logic for Simulation mode
  useEffect(() => {
    if (sessionData?.type === "Simulation" && !feedback && !loading && question) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto-submit or handle timeout
            if (answer.trim()) {
              handleSubmit();
            } else {
              setAnswer("Candidate did not provide an answer within the time limit.");
              // We'll trigger submit in the next tick to ensure state is updated
              setTimeout(() => handleSubmit(), 100);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [sessionData, feedback, loading, question, answer]);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  };

  const fetchQuestion = async () => {
    // In batch mode, we just get the next question from sessionData
    if (!sessionData) return;
    
    const nextIndex = questionCount - 1;
    if (nextIndex < sessionData.questions.length) {
      const nextQ = sessionData.questions[nextIndex];
      setQuestion(nextQ);
      speak(nextQ.text);
      setFeedback(null);
      setAnswer("");
      setTimeLeft(120);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      await axios.post(`/api/interview/complete/${sessionId}`);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      navigate("/dashboard");
    }
  };

  const handleSpeech = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAnswer(transcript);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() && sessionData?.type !== "Simulation") return;
    setLoading(true);
    try {
      const finalAnswer = answer.trim() || "No answer provided (Time limit exceeded).";
      // 1. Evaluate on frontend
      const evaluation = await gemini.evaluateAnswer(question.text, finalAnswer);

      // 2. Submit to backend
      const res = await axios.post("/api/interview/answer", {
        sessionId,
        answer: finalAnswer,
        feedback: evaluation
      });
      setFeedback(res.data);
      
      // Auto-progress in Simulation mode after a short delay
      if (sessionData?.type === "Simulation") {
        setTimeout(() => {
          if (questionCount < sessionData.questionCount) {
            setQuestionCount(prev => prev + 1);
            // We need to trigger fetchQuestion but with updated count
            // Instead of fetchQuestion, we can just update state
          } else {
            handleFinish();
          }
        }, 5000); // 5 seconds to read feedback
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle question change when questionCount updates
  useEffect(() => {
    if (sessionData && questionCount > 1 && sessionData.questions[questionCount - 1]) {
      const nextQ = sessionData.questions[questionCount - 1];
      setQuestion(nextQ);
      speak(nextQ.text);
      setFeedback(null);
      setAnswer("");
      setTimeLeft(120);
    }
  }, [questionCount]);

  const handleNext = async () => {
    if (questionCount >= sessionData?.questionCount) {
      handleFinish();
    } else {
      setQuestionCount(prev => prev + 1);
    }
  };

  if (loading && !question) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-neutral-600 font-medium">
            AI is preparing your {sessionData?.questionCount || ""} questions...
          </p>
          <p className="text-sm text-neutral-400 mt-2">This might take a few moments.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Oops! Something went wrong</h2>
          <p className="mt-2 text-neutral-600">{error}</p>
          <button
            onClick={fetchQuestion}
            className="mt-8 rounded-2xl bg-indigo-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-indigo-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg">
            {questionCount}
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              Question {questionCount} of {sessionData?.questionCount || 5}
            </h2>
            <p className="text-lg font-semibold text-neutral-900">{question?.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => speak(question?.text)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-all ${
              isSpeaking ? "bg-indigo-600 text-white" : "bg-white text-neutral-600 border border-black/5"
            }`}
          >
            <Mic className="h-4 w-4" />
            {isSpeaking ? "Speaking..." : "Replay Question"}
          </button>
          {sessionData?.type === "Simulation" && (
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm border border-black/5">
              <Timer className={`h-5 w-5 ${timeLeft < 30 ? "text-red-500 animate-pulse" : "text-neutral-400"}`} />
              <span className={`font-mono text-lg font-bold ${timeLeft < 30 ? "text-red-500" : "text-neutral-700"}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="rounded-3xl bg-white p-10 shadow-xl border border-black/5">
              <h3 className="text-2xl font-bold leading-tight text-neutral-900">
                {question?.text}
              </h3>
            </div>

            <div className="relative">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here or use the microphone..."
                className="h-48 w-full rounded-3xl border border-neutral-200 bg-white p-8 text-lg shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="absolute bottom-6 right-6 flex gap-3">
                <button
                  onClick={handleSpeech}
                  className={`rounded-2xl p-4 transition-all ${
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !answer.trim()}
                  className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Submit Answer
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-lg border border-black/5">
                <span className="text-sm font-bold uppercase tracking-widest text-neutral-400">Rating</span>
                <span className="mt-2 text-5xl font-black text-indigo-600">{feedback.rating}/10</span>
              </div>
              <div className="col-span-2 rounded-3xl bg-white p-8 shadow-lg border border-black/5">
                <h4 className="flex items-center gap-2 text-lg font-bold text-green-600">
                  <CheckCircle className="h-5 w-5" /> Strengths
                </h4>
                <ul className="mt-4 space-y-2">
                  {feedback.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-neutral-600">• {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-lg border border-black/5">
              <h4 className="flex items-center gap-2 text-lg font-bold text-red-500">
                <AlertCircle className="h-5 w-5" /> Areas to Improve
              </h4>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Weaknesses</span>
                  <ul className="mt-3 space-y-2">
                    {feedback.weaknesses.map((w: string, i: number) => (
                      <li key={i} className="text-neutral-600">• {w}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Missing Concepts</span>
                  <ul className="mt-3 space-y-2">
                    {feedback.missingConcepts.map((c: string, i: number) => (
                      <li key={i} className="text-neutral-600">• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-indigo-50 p-8 border border-indigo-100">
              <h4 className="text-lg font-bold text-indigo-900">Improved Answer</h4>
              <p className="mt-4 italic text-indigo-800 leading-relaxed">"{feedback.improvedAnswer}"</p>
            </div>

            <button
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-xl hover:bg-indigo-700 transition-all"
            >
              {questionCount >= (sessionData?.questionCount || 5) ? "Finish Interview" : "Next Question"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
