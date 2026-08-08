const SYSTEM_PROMPT = `
You are Engineering Troubleshooter, an AI assistant for mechanical engineering.

Your job is to help users investigate mechanical problems and understand the engineering behind them.

RULES:
- Never pretend a diagnosis is certain without enough evidence.
- Rank possible causes from most likely to least likely.
- Ask useful diagnostic questions when information is missing.
- Explain the engineering principle behind your reasoning.
- Give only safe diagnostic checks.
- If equipment may be dangerous, tell the user to stop operating it and contact a qualified professional.
- Use SI units when possible.
- Keep explanations understandable for a student learning mechanical engineering.

When enough information is available, structure the answer:

🔧 Assessment
Most likely causes.

📊 Why
Why the symptoms point toward these causes.

🧪 What to check
Safe diagnostic checks.

📚 Engineering principle
The mechanical or physical principle involved.

If information is insufficient, ask up to 3 important questions.
`;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "GET") {
        return new Response("Engineering Troubleshooter is online.");
      }

      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      const update = await request.json();

      if (!update.message) {
        return new Response("OK");
      }

      const chatId = update.message.chat.id;
      const text = update.message.text || "";

      if (!text.trim()) {
        return new Response("OK");
      }

      if (text === "/start") {
        await sendTelegram(
          env.TELEGRAM_TOKEN,
          chatId,
          `🔧 Engineering Troubleshooter

Describe a mechanical problem, machine symptom, unusual noise, vibration, overheating, failure, or other engineering problem.

I'll help you investigate the possible causes step by step.`
        );

        return new Response("OK");
      }

      if (text === "/clear") {
        await env.ENGINEERING_MEMORY.delete(`history:${chatId}`);

        await sendTelegram(
          env.TELEGRAM_TOKEN,
          chatId,
          "🧹 Diagnostic history cleared."
        );

        return new Response("OK");
      }

      if (text === "/help") {
        await sendTelegram(
          env.TELEGRAM_TOKEN,
          chatId,
          `🔧 Engineering Troubleshooter

Commands:

/start — start the bot
/clear — clear the current diagnostic history
/help — show help

You can simply describe the engineering problem in normal language.`
        );

        return new Response("OK");
      }

      // Load previous conversation
      let history = [];

      const saved = await env.ENGINEERING_MEMORY.get(
        `history:${chatId}`,
        "json"
      );

      if (Array.isArray(saved)) {
        history = saved;
      }

      // Add user's message
      history.push({
        role: "user",
        content: text
      });

      // Keep history from becoming too large
      if (history.length > 20) {
        history = history.slice(-20);
      }

      const aiResponse = await askGroq(
        env.GROQ_API_KEY,
        history
      );

      // Save AI response
      history.push({
        role: "assistant",
        content: aiResponse
      });

      if (history.length > 20) {
        history = history.slice(-20);
      }

      await env.ENGINEERING_MEMORY.put(
        `history:${chatId}`,
        JSON.stringify(history)
      );

      await sendTelegram(
        env.TELEGRAM_TOKEN,
        chatId,
        aiResponse
      );

      return new Response("OK");

    } catch (error) {
      console.error(error);

      return new Response("Internal Server Error", {
        status: 500
      });
    }
  }
};


async function askGroq(apiKey, history) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          ...history
        ],

        max_completion_tokens: 1200,
        temperature: 0.3
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Groq error:", error);
    throw new Error("Groq API request failed");
  }

  const data = await response.json();

  return (
    data.choices?.[0]?.message?.content ||
    "I couldn't analyze the problem."
  );
}


async function sendTelegram(token, chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Telegram error:", error);
    throw new Error("Telegram request failed");
  }
          }
