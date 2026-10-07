import { SERVER_ADRESS } from "@/services/tools/constants";

export const getChatBotAnswer = async (content) => {
  try {
    const res = await fetch(
      SERVER_ADRESS+"chatBot/chatbotAnswer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      },
    );
    if (res.ok) {
      const data = await res.json();
      return {
        error: false,
        data: data.response,
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        data: "<div>L'assistant est momentanement indisponible.</div><div>Merci de repasser très prochainement.</div>",
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};