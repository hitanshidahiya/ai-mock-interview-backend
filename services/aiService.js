import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const callGemini = async (prompt, systemPrompt = null) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

const buildPersonaPrompt = (role, level, difficulty) => {
  const toneMap = {
    easy: "friendly and encouraging, use simple language, avoid jargon",
    medium: "professional and direct, expect solid fundamentals",
    hard: "senior-level, challenging, expect in-depth answers and trade-offs",
  };
  const levelMap = {
    beginner: "The candidate has 0-1 years of experience.",
    intermediate: "The candidate has 2-4 years of experience.",
    advanced: "The candidate has 5+ years of experience.",
  };
  return `You are a senior technical interviewer at a top tech company conducting a ${role} interview.
Tone: ${toneMap[difficulty] || toneMap.medium}.
${levelMap[level] || levelMap.intermediate}
Stay in character throughout. Be precise. Evaluate answers critically but fairly.`;
};

const generateQuestionsAI = async (role, level = "beginner", difficulty = "medium") => {
  try {
    const persona = buildPersonaPrompt(role, level, difficulty);
    const prompt = `Generate exactly 5 technical interview questions for a ${role} at ${level} level with ${difficulty} difficulty.

Return ONLY valid JSON array, no markdown:
[
  { "question": "...", "answer": "..." }
]`;

    const text = await callGemini(prompt, persona);
    const clean = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error("AI generate error:", error.message);
    return [];
  }
};

const evaluateAnswerAI = async (question, correctAnswer, userAnswer, role, difficulty) => {
  try {
    const persona = buildPersonaPrompt(role, "intermediate", difficulty);
    const prompt = `Evaluate the user's interview answer.

Question: ${question}
Expected Answer: ${correctAnswer}
User Answer: ${userAnswer}

Respond ONLY in JSON (no markdown) :
{
  "isCorrect": true/false,
  "isPartial": true/false,
  "score": number (0-10),
  "feedback": "specific, constructive feedback in 1-2 sentences"
}`;

    const text = await callGemini(prompt, persona);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { isCorrect: false, isPartial: false, score: 0, feedback: "Evaluation failed" };
  } catch (error) {
    console.error("AI evaluate error:", error.message);
    return { isCorrect: false, isPartial: false, score: 0, feedback: "Evaluation failed" };
  }
};

const deepDiveAnalysis = async (questions, role) => {
  try {
    const transcript = questions.map((q, i) =>
      `Q${i+1}: ${q.question}\nAnswer: ${q.userAnswer || "No answer"}`
    ).join("\n\n");

    const fillerWords = ["um", "uh", "like", "you know", "basically", "literally", "actually", "so", "right", "okay so"];
    const allAnswers = questions.map(q => (q.userAnswer || "").toLowerCase()).join(" ");
    const fillerFound = fillerWords.filter(fw => allAnswers.includes(fw));
    const fillerWordCount = fillerFound.reduce((acc, fw) => {
      const matches = allAnswers.match(new RegExp(`\\b${fw}\\b`, "g"));
      return acc + (matches ? matches.length : 0);
    }, 0);

    const prompt = `You are analyzing a ${role} interview transcript. Provide deep structured feedback.

TRANSCRIPT:
${transcript}

Return ONLY valid JSON (no markdown) :
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasToImprove": ["area 1", "area 2", "area 3"],
  "summary": "2-3 sentence overall performance summary",
  "improvedAnswers": [
    { "question": "exact question text", "improvedAnswer": "how to answer this better" }
  ]
}`;

    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      fillerWordCount,
      fillerWords: fillerFound,
      strengths: result.strengths || [],
      areasToImprove: result.areasToImprove || [],
      summary: result.summary || "",
      improvedAnswers: result.improvedAnswers || [],
    };
  } catch (error) {
    console.error("Deep dive error:", error.message);
    return { fillerWordCount: 0, fillerWords: [], strengths: [], areasToImprove: [], summary: "", improvedAnswers: [] };
  }
};

export { generateQuestionsAI, evaluateAnswerAI, deepDiveAnalysis, buildPersonaPrompt };