
import { GoogleGenAI, Type } from "@google/genai";
import { FlowerSuggestion, SubscriptionPlan } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getFlowerStyling = async (
  input: string | { base64: string, mimeType: string }
): Promise<FlowerSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Identify this flower (if an image) or use the name provided. 
  Provide expert floral styling advice and detailed care instructions.
  Include meanings, wrapping techniques for different occasions (e.g., Anniversary, Sympathy, Celebration), 
  complementary flowers, a color palette suggestion, and care requirements (watering, sunlight, and temperature strictly in Celsius).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: typeof input === 'string' 
      ? prompt + "\nFlower Name: " + input 
      : { 
          parts: [
            { text: prompt },
            { inlineData: { data: input.base64, mimeType: input.mimeType } }
          ] 
        },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          botanicalName: { type: Type.STRING },
          meaning: { type: Type.STRING },
          wrappingTechniques: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                occasion: { type: Type.STRING },
                description: { type: Type.STRING },
                materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                styleNotes: { type: Type.STRING }
              },
              required: ["occasion", "description", "materials", "styleNotes"]
            }
          },
          complementaryFlowers: { type: Type.ARRAY, items: { type: Type.STRING } },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          careInstructions: {
            type: Type.OBJECT,
            properties: {
              watering: { type: Type.STRING },
              sunlight: { type: Type.STRING },
              temperature: { 
                type: Type.STRING,
                description: "The ideal temperature range strictly in Celsius, e.g., '18-24°C'."
              }
            },
            required: ["watering", "sunlight", "temperature"]
          }
        },
        required: ["name", "wrappingTechniques", "complementaryFlowers", "colorPalette", "careInstructions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateFlowerImage = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, professional editorial photograph of a beautiful floral arrangement. ${prompt}. The lighting is soft and natural, studio setting with a clean background. High resolution, aesthetic composition.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Image generation failed:", err);
    return null;
  }
};

export const getSubscriptionPlan = async (vibe: string, preferredFlowers?: string): Promise<SubscriptionPlan> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const flowerContext = preferredFlowers ? ` The user also specifically likes these flowers: "${preferredFlowers}", so try to incorporate them or similar varieties into the plan.` : "";
  const prompt = `Create a 4-week floral subscription plan with the theme: "${vibe}".${flowerContext}
  Each week should feature a different main flower and seasonal pairings. 
  Provide a care tip for each week. Ensure the variety is diverse but adheres to the vibe.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.INTEGER },
                theme: { type: Type.STRING },
                mainFlower: { type: Type.STRING },
                secondaryFlowers: { type: Type.ARRAY, items: { type: Type.STRING } },
                vibe: { type: Type.STRING },
                careTip: { type: Type.STRING }
              },
              required: ["week", "mainFlower", "theme", "vibe", "careTip"]
            }
          }
        },
        required: ["title", "description", "weeks"]
      }
    }
  });

  return JSON.parse(response.text);
};
