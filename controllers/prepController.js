const { generateQuestionsAI } = require("../services/aiService.js");
const axios = require("axios");

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const callGemini = async (prompt) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  const response = await axios.post(
    `${GEMINI_URL}?key=${API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

exports.getPrepQuestions = async (req, res) => {
  try {
    const { category = "technical", role = "Software Developer", level = "intermediate" } = req.query;

    const categoryPrompts = {
      hr: `Generate 8 common HR interview questions for a ${role} position. Include questions about teamwork, conflict resolution, strengths/weaknesses, and career goals.`,
      technical: `Generate 8 technical interview questions for a ${role} at ${level} level. Cover core concepts, problem solving, and best practices.`,
      dsa: `Generate 8 Data Structures and Algorithms interview questions for a ${role} at ${level} level. Include arrays, trees, graphs, dynamic programming topics.`,
    };

    const prompt = `${categoryPrompts[category] || categoryPrompts.technical}

Return ONLY valid JSON array, no markdown:
[
  {
    "question": "...",
    "idealAnswer": "...",
    "difficulty": "easy|medium|hard",
    "tags": ["tag1", "tag2"]
  }
]`;

    const data = await callGemini(prompt);
    if (!data.candidates) return res.status(500).json({ message: "AI error" });

    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);

    res.json({ category, questions });
  } catch (err) {
    console.error("Prep questions error:", err.message);
    res.status(500).json({ message: "Failed to generate prep questions" });
  }
};

exports.getAITip = async (req, res) => {
  try {
    const { role, overallScore, totalInterviews } = req.body;

    const prompt = `You are a career coach. A user is preparing for ${role} interviews.
Stats: ${totalInterviews} interviews completed, average score ${overallScore}/50.

Give 3 short, specific, actionable tips to improve their interview performance.

Return ONLY valid JSON:
{
  "tips": ["tip1", "tip2", "tip3"],
  "encouragement": "one short motivational sentence"
}`;

    const data = await callGemini(prompt);
    if (!data.candidates) return res.status(500).json({ message: "AI error" });

    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json(result || { tips: [], encouragement: "Keep practicing!" });
  } catch (err) {
    console.error("AI tip error:", err.message);
    res.status(500).json({ message: "Failed to get AI tip" });
  }
};

exports.getRoleSuggestions = async (req, res) => {
  try {
    const { currentRole, scores } = req.body;

    const prompt = `Based on someone practicing for ${currentRole} interviews with scores: ${JSON.stringify(scores)},
suggest 4 related career paths or roles they should also prepare for.

Return ONLY valid JSON:
{
  "suggestions": [
    { "role": "...", "reason": "...", "similarity": "high|medium|low" }
  ]
}`;

    const data = await callGemini(prompt);
    if (!data.candidates) return res.status(500).json({ message: "AI error" });

    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json(result || { suggestions: [] });
  } catch (err) {
    console.error("Role suggestions error:", err.message);
    res.status(500).json({ message: "Failed to get role suggestions" });
  }
};
