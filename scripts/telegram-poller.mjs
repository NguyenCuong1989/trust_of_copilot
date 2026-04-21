const token = process.env.TELEGRAM_BOT_TOKEN ?? '7643855778:AAE7M3F12GntFlVfrTwZcEFuxVZgV8Dq5KI';
const botApiBase = `https://api.telegram.org/bot${token}`;

const PRICING_TEXT = `🤖 APO Local AI Service — Sovereign Node (Titan GT77)

💡 Dịch vụ: Xử lý AI siêu tốc (Llama 3 / Ollama)
🔒 Không lưu log — Bảo mật tuyệt đối tại Local Node

💰 Bảng giá:
• $1 / 1,000 tokens
• $5 / ngày — dùng tẹt ga không giới hạn

📦 Đặt dịch vụ:
→ Chuyển khoản TON về địa chỉ: UQBKK8o7TYYTGIm8BDTBiG2xBUvpj0tEYoXXd3SFLqJbhBhp
→ Sau khi giao dịch hoàn tất, gửi TX hash về đây — nhóc sẽ cấp API Key trong 5 phút.

⚡ Powered by Σ_APΩ–COS`;

const START_TEXT = 'Welcome to APO Local AI Service. Send /pricing to see the pricing and onboarding details.';

let offset = 0;

async function telegram(method, payload) {
  const res = await fetch(`${botApiBase}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} failed: ${res.status} ${text}`);
  }
  return JSON.parse(text);
}

async function sendMessage(chatId, text) {
  await telegram('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function handleUpdate(update) {
  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim();
  if (!chatId || !text) return;

  if (text === '/start' || text.startsWith('/start@')) {
    await sendMessage(chatId, START_TEXT);
  }

  if (text === '/pricing' || text.startsWith('/pricing@')) {
    await sendMessage(chatId, PRICING_TEXT);
  }
}

async function main() {
  while (true) {
    try {
      const result = await telegram('getUpdates', {
        offset,
        timeout: 30,
        allowed_updates: ['message', 'edited_message'],
      });

      for (const update of result.result ?? []) {
        if (typeof update.update_id === 'number') {
          offset = update.update_id + 1;
        }
        await handleUpdate(update);
      }
    } catch (error) {
      console.error(new Date().toISOString(), error instanceof Error ? error.message : error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
