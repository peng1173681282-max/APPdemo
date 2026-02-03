
import { GoogleGenAI } from "@google/genai";

// Fix: Initialize GoogleGenAI using the exact pattern required by guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (query: string, userContext: string) => {
  try {
    // Fix: Use ai.models.generateContent with gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User Financial Context: ${userContext}\n\nUser Question: ${query}`,
      config: {
        systemInstruction: "You are an expert financial advisor for a credit app. Give concise, helpful, and safe financial advice. Focus on improving credit scores, managing debt, and explaining loan terms in simple Chinese.",
      },
    });
    // Fix: Access the .text property directly (not as a method)
    return response.text || "Sorry, I couldn't generate advice right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The financial advisor is temporarily unavailable. Please try again later.";
  }
};
