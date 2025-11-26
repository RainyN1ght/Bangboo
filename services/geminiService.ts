import { GoogleGenAI, Modality } from "@google/genai";
import { blobToBase64 } from "../utils/audioUtils";

// Initialize Gemini Client
// NOTE: We recreate the client in calls to ensure fresh keys if needed, 
// but for this environment, process.env.API_KEY is static.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateRobotResponse = async (
  input: string | Blob
): Promise<{ text: string; audioBase64?: string }> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash"; // Logic model

  try {
    let userPart: any;

    if (typeof input === 'string') {
      userPart = { text: input };
    } else {
      const base64 = await blobToBase64(input);
      userPart = {
        inlineData: {
          // Default to webm for browser recordings (Chrome/Firefox default)
          // Sending webm data labeled as wav can cause server-side decode errors
          mimeType: input.type || 'audio/webm',
          data: base64
        }
      };
    }

    // 1. Get Text Response
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            { text: "你是一个名为'鲨鱼邦布'的桌面机器人助手。你的性格非常活泼可爱，说话像二次元的元气少女。请用中文回答用户，回答要简短（2句话以内），语气要萌一点，喜欢加语气词（比如'呐'、'嘿嘿'）。" },
            userPart
          ]
        }
      ]
    });

    const textResponse = response.text || "哎呀，没听清呢~";

    // 2. Get Audio Response (TTS)
    // We use a separate call for TTS
    const ttsResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: textResponse }]
        }
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // Kore works well for female/neutral tones
          }
        }
      }
    });

    const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    return {
      text: textResponse,
      audioBase64: audioBase64
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "系统出错了呜呜呜..." };
  }
};