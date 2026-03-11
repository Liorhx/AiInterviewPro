import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateQuestionsBatch = async (role: string, difficulty: string, count: number, resumeText?: string, jobDescription?: string) => {
  const prompt = `
    Act as a Senior ${role} Interviewer. 
    Generate ${count} interview questions at ${difficulty} difficulty level.
    ${resumeText ? `Consider the candidate's background: ${resumeText}` : ""}
    ${jobDescription ? `Tailor the questions to this specific job description and company context: ${jobDescription}` : ""}
    
    The questions should cover various categories like Technical, Coding, Scenario-based, and Behavioral.
    Ensure the questions are realistic, role-specific, and aligned with the job and company context if provided.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            expectedOutline: { type: Type.STRING }
          },
          required: ["text", "category", "difficulty", "expectedOutline"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const generateQuestion = async (role: string, difficulty: string, category: string, resumeText?: string) => {
  const prompt = `
    Act as a Senior ${role} Interviewer. 
    Generate a ${difficulty} level ${category} question for a candidate.
    ${resumeText ? `Consider the candidate's background: ${resumeText}` : ""}
    
    Return ONLY a JSON object with this structure:
    {
      "text": "The question text",
      "category": "${category}",
      "difficulty": "${difficulty}",
      "expectedOutline": "Brief outline of what a good answer should include"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
};

export const evaluateAnswer = async (question: string, answer: string) => {
  const prompt = `
    Evaluate the following interview answer.
    Question: "${question}"
    Candidate Answer: "${answer}"
    
    Return ONLY a JSON object with this structure:
    {
      "rating": 0-10 (number),
      "strengths": ["list of strengths"],
      "weaknesses": ["list of weaknesses"],
      "missingConcepts": ["concepts the candidate missed"],
      "improvedAnswer": "A better version of the answer"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzePerformance = async (sessions: any[]) => {
  const prompt = `
    Analyze the following interview sessions for a candidate.
    Sessions: ${JSON.stringify(sessions)}
    
    Generate a summary with:
    1. Overall average score and score trend over time.
    2. Top strengths.
    3. Weak topics or concepts needing improvement.
    4. Personalized recommendations for next practice sessions or simulations.
    5. Suggested focus areas based on performance.
    
    Return ONLY a JSON object with this structure:
    {
      "avgScore": number,
      "scoreTrend": [{"date": "string", "score": number}],
      "strengths": ["string"],
      "weakTopics": ["string"],
      "recommendations": ["string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(response.text || "{}");
};
