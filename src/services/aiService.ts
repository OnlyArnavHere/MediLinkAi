import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getClinicalPrediction(clinicalData: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `As an AI-CDSS, analyze the following patient clinical data and provide a diagnosis/risk prediction, confidence score (0-1), and suggested recommendations. Return the result in JSON format with keys: prediction, confidence, recommendations.
    
    Clinical Data: ${clinicalData}`,
    config: {
      responseMimeType: "application/json"
    }
  });
  
  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return {
      prediction: "Error analyzing data",
      confidence: 0,
      recommendations: "Please consult a specialist manually."
    };
  }
}

export async function getDiseaseAwareness(topic: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide educational awareness about the following disease or health topic: ${topic}. Include symptoms, prevention, and when to see a doctor. Keep it professional and informative.`,
  });
  return response.text;
}

export async function searchMedicalTerm(term: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Explain the medical term: ${term} in simple language for a patient to understand.`,
  });
  return response.text;
}
