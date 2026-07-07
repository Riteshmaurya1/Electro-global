import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function parseQueryLLM(userQuery) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0 },
  });

  const prompt = `
You are a car search assistant. Extract filters from the user's query.

Return ONLY valid JSON in this exact shape, no explanation, no markdown fences:
{
  "budgetMax": number | null,
  "fuelType": "Petrol" | "Diesel" | "Electric" | "CNG" | null,
  "segment": "SUV" | "Sedan" | "Hatchback" | "MPV" | "Compact SUV" | null,
  "transmission": "Automatic" | "Manual" | null,
  "minSeating": number | null,
  "brand": string | null,
  "sortBy": "mileage" | "price" | "popularity" | null
}

Rules:
- budgetMax must be a SINGLE number in LAKHS representing the user's MAXIMUM budget.
  Example: "under 15 lakhs" -> 15.
- NEVER return a range. Only one number.
- If no budget mentioned, budgetMax must be null.
- Never return more than 100 for budgetMax.
- If a field isn't mentioned, set it to null. Do not guess.

User query: "${userQuery}"
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/```json|```/g, "").trim();
  console.log("Gemini raw response:", cleaned);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("Gemini JSON parse error:", cleaned);
    return {};
  }

  if (parsed.budgetMax != null) {
    const num = Number(parsed.budgetMax);
    parsed.budgetMax = Number.isFinite(num) ? num : null;
  }

  return parsed;
}