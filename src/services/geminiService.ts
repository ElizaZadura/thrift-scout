import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ItemEvaluation {
  itemName: string;
  description: string;
  activeListingsRange: string;
  soldPricesRange: string;
  estimatedBargainThreshold: string;
  confidence: "Low" | "Medium" | "High";
  whyFlagged: string[];
  keyFeatures: string[];
  searchQueries: string[];
  baseResaleValueMin: number;
  baseResaleValueMax: number;
  currency: string;
}

export async function evaluateItem(base64Image: string, mimeType: string): Promise<{ evaluation: ItemEvaluation, groundingChunks?: any[] }> {
  console.log(`Evaluating item with mimeType: ${mimeType}`);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: "Identify this item and estimate its resale value. Separate market signals into active listings and recent sold prices. Prioritize sold prices for the base resale value estimate. Provide a bargain threshold, confidence level, and reasons why this item might be worth checking (why flagged). Include numerical min/max base resale values based on sold prices for calculation purposes, and specify the currency (e.g., SEK, USD). Use Google Search to find current market prices if possible." }
          ]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING, description: "The name of the item (brand, type, model)" },
            description: { type: Type.STRING, description: "A brief description of the item" },
            activeListingsRange: { type: Type.STRING, description: "Active listings price range, e.g., 250-600 SEK" },
            soldPricesRange: { type: Type.STRING, description: "Recent sold prices range, e.g., 140-220 SEK" },
            estimatedBargainThreshold: { type: Type.STRING, description: "Estimated bargain threshold, e.g., Buy under ~80 SEK" },
            confidence: { type: Type.STRING, description: "Confidence in the evaluation: Low, Medium, or High" },
            whyFlagged: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Short bullet points explaining why the item might be interesting or worth checking"
            },
            keyFeatures: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Key features to look for to confirm authenticity or value"
            },
            searchQueries: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Suggested Google search queries to find more info"
            },
            baseResaleValueMin: { type: Type.NUMBER, description: "Numerical minimum estimated resale value based on sold prices" },
            baseResaleValueMax: { type: Type.NUMBER, description: "Numerical maximum estimated resale value based on sold prices" },
            currency: { type: Type.STRING, description: "Currency of the numerical values, e.g., SEK" }
          },
          required: ["itemName", "description", "activeListingsRange", "soldPricesRange", "estimatedBargainThreshold", "confidence", "whyFlagged", "keyFeatures", "searchQueries", "baseResaleValueMin", "baseResaleValueMax", "currency"]
        }
      }
    });

    const text = response.text;
    console.log("Raw response text from Gemini:", text);
    
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    try {
      const evaluation = JSON.parse(text) as ItemEvaluation;
      return {
        evaluation,
        groundingChunks
      };
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", text);
      throw new Error("The AI response was not in the expected format. Please try again.");
    }
  } catch (apiError) {
    console.error("Gemini API call failed:", apiError);
    throw apiError;
  }
}
