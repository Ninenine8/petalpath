
import { GoogleGenAI, Type } from "@google/genai";
import { FlowerSuggestion, SubscriptionPlan } from "../types";

/**
 * Sanitizes a string that might contain markdown JSON blocks
 */
const sanitizeJsonResponse = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

export const getFlowerStyling = async (
  input: string | { base64: string, mimeType: string }
): Promise<FlowerSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a world-class professional floral stylist and botanist. 
Identify the flower(s) provided and offer expert styling, wrapping, and care advice. 
If multiple flowers are provided, treat them as a request for a cohesive bouquet arrangement.

MANDATORY OUTPUTS:
1. "Wedding Bouquet": Professional bridal style and pairing.
2. "Easy Option": A beginner-friendly, 2-minute styling guide using common household vessels (jars, mugs).
3. "Wrapping Techniques": 3 pro-level wrapping styles.

Care instructions must include sunlight, watering, and temperature (strictly in Celsius).
Output MUST be valid JSON adhering to the provided schema.`;

  const prompt = typeof input === 'string' 
    ? `Flower(s) to analyze: ${input}` 
    : "Identify and style the flower(s) in this image.";

  const contents = typeof input === 'string' 
    ? prompt 
    : { 
        parts: [
          { text: prompt },
          { inlineData: { data: input.base64, mimeType: input.mimeType } }
        ] 
      };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction,
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
          weddingBouquet: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING },
              description: { type: Type.STRING },
              stems: { type: Type.ARRAY, items: { type: Type.STRING } },
              stylingTip: { type: Type.STRING }
            },
            required: ["style", "description", "stems", "stylingTip"]
          },
          easyOption: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              effortTime: { type: Type.STRING },
              vesselType: { type: Type.STRING },
              guide: { type: Type.ARRAY, items: { type: Type.STRING } },
              proTip: { type: Type.STRING }
            },
            required: ["title", "effortTime", "vesselType", "guide", "proTip"]
          },
          complementaryFlowers: { type: Type.ARRAY, items: { type: Type.STRING } },
          colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
          careInstructions: {
            type: Type.OBJECT,
            properties: {
              watering: { type: Type.STRING },
              sunlight: { type: Type.STRING },
              temperature: { type: Type.STRING }
            },
            required: ["watering", "sunlight", "temperature"]
          }
        },
        required: ["name", "wrappingTechniques", "weddingBouquet", "easyOption", "complementaryFlowers", "colorPalette", "careInstructions"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI.");
  
  try {
    return JSON.parse(sanitizeJsonResponse(text));
  } catch (err) {
    console.error("Parse error on text:", text);
    throw new Error("Invalid data format received from stylist.");
  }
};

export const generateFlowerImage = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A professional photograph of a floral arrangement: ${prompt}. Clean minimalist background, natural light.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    const candidates = response.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (err) {
    console.warn("Visual generation skipped:", err);
    return null;
  }
};

export const getSubscriptionPlan = async (vibe: string, preferredFlowers?: string): Promise<SubscriptionPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = "You are a floral subscription curator. Design a 4-week journey. Return valid JSON.";
  const prompt = `Vibe: ${vibe}. ${preferredFlowers ? `Preferred flowers: ${preferredFlowers}` : ""}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
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

  const text = response.text;
  if (!text) throw new Error("Subscription plan failed.");
  return JSON.parse(sanitizeJsonResponse(text));
};
