import { GoogleGenAI, Type } from "@google/genai";
import { LevelConfig, ObstacleType } from "../types";

let ai: GoogleGenAI | null = null;

export const generateLevel = async (prompt: string): Promise<LevelConfig> => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      console.warn("API Key is missing, using fallback.");
      throw new Error("API Key is missing");
    }

    if (!ai) {
      ai = new GoogleGenAI({ apiKey });
    }

    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate a Mario-style level configuration based on this description: "${prompt}". 
      The level should be a sequence of obstacles.
      Obstacle types available: PIPE, GOOMBA, BLOCK, QUESTION_BLOCK, GAP, COIN, SHELL, FIRE_FLOWER, PIRANHA.
      PIRANHA usually appears near PIPE. FIRE_FLOWER should be rare (powerup).
      Provide a difficulty rating (Easy, Medium, Hard), a theme (OVERWORLD, UNDERGROUND, CASTLE), and a short fun description.
      Return at least 40 items in the sequence for a decent run.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            description: { type: Type.STRING },
            theme: { type: Type.STRING, enum: ['OVERWORLD', 'UNDERGROUND', 'CASTLE'] },
            obstacles: {
              type: Type.ARRAY,
              items: { type: Type.STRING, enum: Object.values(ObstacleType) }
            }
          },
          required: ["name", "difficulty", "description", "obstacles", "theme"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    return { ...data, id: 'gen_' + Date.now(), isCustom: true };
  } catch (error) {
    console.error("Level generation failed:", error);
    // Fallback level
    return {
      id: 'fallback_error',
      name: "Classic Fallback",
      difficulty: "Medium",
      description: "Network error or missing key. Here is a classic pipe run.",
      theme: 'OVERWORLD',
      obstacles: [
        ObstacleType.COIN, ObstacleType.QUESTION_BLOCK, ObstacleType.FIRE_FLOWER,
        ObstacleType.PIPE, ObstacleType.PIRANHA, ObstacleType.GAP,
        ObstacleType.PIPE, ObstacleType.GOOMBA, ObstacleType.COIN,
        ObstacleType.SHELL, ObstacleType.PIPE, ObstacleType.GAP,
        ObstacleType.BLOCK, ObstacleType.GOOMBA, ObstacleType.COIN
      ]
    };
  }
};
