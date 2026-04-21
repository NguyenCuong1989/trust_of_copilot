const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const commands = [
  { command: 'start', description: 'Welcome and quick instructions' },
  { command: 'pricing', description: 'Show pricing for APO Local AI Service' },
];

async function telegram(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
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

const results = {};
results.setMyCommands = await telegram('setMyCommands', { commands });

if (webhookUrl) {
  results.setWebhook = await telegram('setWebhook', {
    url: `${webhookUrl.replace(/\/$/, '')}/api/telegram`,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  });
}

console.log(JSON.stringify(results, null, 2));
