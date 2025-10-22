
import { GoogleGenAI, Type } from "@google/genai";
import { Clip, ClipType } from '../types';

function secondsToHHMMSS(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

export const parsePromptForClips = async (userInput: string, videoDuration: number): Promise<Clip[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const videoDurationFormatted = secondsToHHMMSS(videoDuration);

  const systemInstruction = `You are an expert video editing assistant. Your task is to parse a user's prompt and extract time ranges for video clips. The total video duration is ${videoDurationFormatted}.

Follow these rules strictly:
1. Identify all explicit time ranges (e.g., "2:00-4:30", "from 1:10:05 to 1:12:00"). Convert them to HH:MM:SS format. Label these as '${ClipType.Manual}'.
2. Identify all descriptive scene requests (e.g., "all fight scenes", "emotional dialogue"). For these, you must invent plausible start and end timestamps. Do NOT say you cannot fulfill the request. The timestamps should be realistic but are for demonstration purposes. Label these as '${ClipType.AI}'.
3. The end time for any clip must be greater than its start time.
4. The end time for any clip must not exceed the total video duration of ${videoDurationFormatted}.
5. Ensure startTime and endTime are always in HH:MM:SS format. For example, '2:30' should be '00:02:30'.
6. Provide your response ONLY in the specified JSON format, using the provided schema. Do not add any introductory text, explanations, or markdown formatting around the JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userInput,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: {
              type: Type.STRING,
              description: 'Start time in HH:MM:SS format.',
            },
            endTime: {
              type: Type.STRING,
              description: 'End time in HH:MM:SS format.',
            },
            type: {
              type: Type.STRING,
              description: `Either '${ClipType.Manual}' or '${ClipType.AI}'.`,
            },
            description: {
                type: Type.STRING,
                description: 'A brief description or the original text from the prompt for this clip.',
            }
          },
          required: ["startTime", "endTime", "type", "description"],
        },
      },
    },
  });

  const jsonText = response.text.trim();
  const parsedResponse: Clip[] = JSON.parse(jsonText);
  return parsedResponse;
};
