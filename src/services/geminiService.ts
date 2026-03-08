import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ItemEvaluation {
  itemName: string;
  description: string;
  estimatedValueRange: string;
  keyFeatures: string[];
  resalePotential: "Low" | "Medium" | "High";
  searchQueries: string[];
}

export async function evaluateItem(base64Image: string, mimeType: string): Promise<{ evaluation: ItemEvaluation, groundingChunks?: any[] }> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Identify this item and estimate its resale value. Provide a brief description, what to look for to confirm its authenticity or value, and an estimated price range. Use Google Search to find current market prices if possible." }
        ]
      }
    ],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING, description: "The name of the item" },
          description: { type: Type.STRING, description: "A brief description of the item" },
          estimatedValueRange: { type: Type.STRING, description: "An estimated price range, e.g., $50 - $100" },
          keyFeatures: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Key features to look for to confirm authenticity or value"
          },
          resalePotential: { 
            type: Type.STRING, 
            description: "The resale potential of the item: Low, Medium, or High"
          },
          searchQueries: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Suggested Google search queries to find more info"
          }
        },
        required: ["itemName", "description", "estimatedValueRange", "keyFeatures", "resalePotential", "searchQueries"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  return {
    evaluation: JSON.parse(text) as ItemEvaluation,
    groundingChunks
  };
}
