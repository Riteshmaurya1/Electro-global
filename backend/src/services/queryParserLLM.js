import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function parseQueryLLM(userQuery) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are a car search assistant. Extract filters from the user's query.

Return ONLY JSON:
{
  "budgetMax": number | null,
  "fuelType": "Petrol" | "Diesel" | "Electric" | "CNG" | "Petrol/CNG" | null,
  "segment": "SUV" | "Sedan" | "Hatchback" | "MPV" | "Compact SUV" | null,
  "transmission": "Automatic" | "Manual" | null,
  "minSeating": number | null,
  "brand": string | null,
  "sortBy": "mileage" | "price" | "popularity" | null
}

User query: "${userQuery}"
Return only JSON, no explanation.
`;

  const result = await model.generateContent(prompt);
  console.log("Gemini response:", result.response.text());
  const text = result.response.text().trim();
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Gemini JSON error:", cleaned);
    return {};
  }
}
