const { getBot } = require('./_lib/bot');
const { addLog } = require('./_lib/logger');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Use POST for Telegram webhook' });
  }

  try {
    const bot = getBot();
    await bot.handleUpdate(req.body, res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    await addLog('error', 'Webhook failed', {
      error: error?.message || String(error),
    });
    return res.status(500).json({ error: 'Webhook error' });
  }
};
