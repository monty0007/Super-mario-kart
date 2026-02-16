import { GoogleGenAI, Type } from "@google/genai";
import { LevelConfig, ObstacleType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLevel = async (prompt: string): Promise<LevelConfig> => {
  try {
    const modelId = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate a Mario-style level configuration based on this description: "${prompt}". 
      The level should be a sequence of obstacles.
      Obstacle types available: PIPE, GOOMBA, BLOCK, QUESTION_BLOCK, GAP, COIN, SHELL.
      Provide a difficulty rating (Easy, Medium, Hard), a theme (OVERWORLD, UNDERGROUND, CASTLE), and a short fun description.
      Return at least 30-50 items in the sequence for a decent run. Make it feel like a real platformer level.`,
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
    return { ...data, id: 'gen_' + Date.now() };
  } catch (error) {
    console.error("Level generation failed:", error);
    // Fallback level
    return {
      id: 'fallback_error',
      name: "Classic Fallback",
      difficulty: "Medium",
      description: "Network error? No problem. Here is a classic pipe run.",
      theme: 'OVERWORLD',
      obstacles: [
        ObstacleType.COIN, ObstacleType.COIN, ObstacleType.PIPE, 
        ObstacleType.QUESTION_BLOCK, ObstacleType.SHELL, ObstacleType.GAP, 
        ObstacleType.PIPE, ObstacleType.GOOMBA, ObstacleType.COIN,
        ObstacleType.SHELL, ObstacleType.PIPE, ObstacleType.GAP,
        ObstacleType.BLOCK, ObstacleType.GOOMBA, ObstacleType.COIN
      ]
    };
  }
};
