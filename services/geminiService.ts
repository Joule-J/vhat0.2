
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

/*
 * SECURITY NOTE:
 * In a production environment, the API Key should NOT be exposed on the client side.
 * Best practice is to use a Backend Proxy (Node.js/Express/Edge Function) to handle these requests.
 * Since this is a demo client-side application, we are using process.env.
 */

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAIResponse = async (
  history: Message[],
  roomContext: string
): Promise<string> => {
  try {
    // Format history for the AI to understand context
    const conversationText = history
      .slice(-10) // Only take last 10 messages to keep context relevant and fast
      .map(msg => `${msg.senderName}: ${msg.text}`)
      .join('\n');

    const prompt = `
      Şu an bir sohbet odasındasın. Oda kodu/konusu: "${roomContext}".
      
      İşte son konuşmalar:
      ${conversationText}
      
      Lütfen bu sohbete "AI Asistan" olarak, sohbetteki bağlama uygun, yardımcı veya eğlenceli kısa bir cevap ver.
      Eğer bir soru sorulmadıysa, sohbete doğal bir katkıda bulun.
      Cevabın Türkçe olsun ve çok uzun olmasın (maksimum 2-3 cümle).
      Asla kullanıcının özel bilgilerini sorma veya kaydetme.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "Sen yardımsever, arkadaş canlısı ve Türkçe konuşan bir yapay zeka asistanısın. Güvenli ve saygılı bir dil kullan.",
      }
    });

    return response.text || "Üzgünüm, şu an cevap veremiyorum.";
  } catch (error) {
    // Log only generic error to console to avoid leaking sensitive info in potential user screenshots
    console.error("Secure AI Request Failed"); 
    // Return generic user facing message
    return "Bağlantı veya güvenlik politikası nedeniyle yanıt oluşturulamadı.";
  }
};
