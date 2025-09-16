import { GoogleGenAI, Modality } from "@google/genai";
import type { GeminiResponse } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = (reader.result as string).split(',')[1];
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Failed to convert file to Base64."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const editImageWithNanoBanana = async (
  dressImages: File[],
  modelImage: File | null,
  prompt: string
): Promise<GeminiResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const allImageFiles = [...dressImages];
    if (modelImage) {
      allImageFiles.push(modelImage);
    }

    const imageParts = await Promise.all(
      allImageFiles.map(async (imageFile) => {
        const base64 = await fileToBase64(imageFile);
        return {
          inlineData: {
            data: base64,
            mimeType: imageFile.type,
          },
        };
      })
    );

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [...imageParts, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const geminiResponse: GeminiResponse = { imageUrl: null, text: null };

    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
       for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          geminiResponse.text = part.text;
        } else if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;
          geminiResponse.imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
        }
      }
    }
   
    if (!geminiResponse.imageUrl) {
        throw new Error("API did not return an image. It might have been blocked due to safety policies.");
    }

    return geminiResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};