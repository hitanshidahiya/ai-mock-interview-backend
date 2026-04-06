import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateQuestions = async (role, level) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Generate 5 technical interview questions for a ${role} (${level} level).

Return ONLY valid JSON:
[
  { "question": "...", "answer": "..." }
]
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Failed to parse Gemini response");
  }
};