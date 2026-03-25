const { getBot } = require('./_lib/bot');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(400).json({ error: 'TELEGRAM_WEBHOOK_URL is not set' });
  }

  try {
    const bot = getBot();
    const info = await bot.telegram.setWebhook(webhookUrl);
    return res.status(200).json({ ok: info, webhookUrl });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to set webhook',
      details: error?.message || String(error),
    });
  }
};
