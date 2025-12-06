import { GoogleGenAI, Type, Schema } from "@google/genai";
import { User } from "../types";

// Schema for the expected output from Gemini
const expenseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "What was purchased or paid for.",
    },
    amount: {
      type: Type.NUMBER,
      description: "The total numeric amount of the expense.",
    },
    payerName: {
      type: Type.STRING,
      description: "The name of the person who paid. If 'I' or 'me', map to the current user's name.",
      nullable: true,
    },
    involvedNames: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of names of people involved in the split.",
    },
  },
  required: ["description", "amount", "involvedNames"],
};

export const parseExpenseText = async (text: string, users: User[]): Promise<any> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please set it in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const userNames = users.map(u => u.name).join(", ");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Parse the following expense description into structured data.
        Context: The group members are: ${userNames}.
        If the text says 'I', assume it is 'You'.
        
        Text to parse: "${text}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: expenseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw error;
  }
};