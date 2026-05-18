import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const evaluateAnswer = async (question, correct, userAnswer) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
Question: ${question}
Expected Answer: ${correct}
User Answer: ${userAnswer}

Evaluate the answer.

Return ONLY JSON:
{
  "score": number (0-10),
  "feedback": "short feedback"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text);
};