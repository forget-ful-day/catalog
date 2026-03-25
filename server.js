require('dotenv').config();

const express = require('express');
const path = require('node:path');
const { readJson, writeJson } = require('./api/_lib/storage');
const { addLog, getLogs } = require('./api/_lib/logger');
const { startBotPolling, restartBotPolling, getCurrentToken } = require('./api/_lib/bot');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

async function getConfig() {
  const data = await readJson('config.json', {});
  return {
    telegramBotToken: data.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '',
    adminTelegramId: data.adminTelegramId || process.env.ADMIN_TELEGRAM_ID || '',
    adminToken: data.adminToken || process.env.ADMIN_TOKEN || '',
  };
}

async function isAuthorized(req) {
  const cfg = await getConfig();
  if (!cfg.adminToken) {
    return true;
  }
  return req.headers['x-admin-token'] === cfg.adminToken;
}

function sanitizeConfig(cfg) {
  const token = cfg.telegramBotToken || '';
  const visible = token ? `${token.slice(0, 6)}...${token.slice(-4)}` : '';
  return {
    telegramBotTokenMasked: visible,
    hasTelegramBotToken: Boolean(token),
    adminTelegramId: cfg.adminTelegramId || '',
    hasAdminToken: Boolean(cfg.adminToken),
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/config', async (req, res) => {
  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cfg = await getConfig();
  return res.json(sanitizeConfig(cfg));
});

app.post('/api/config', async (req, res) => {
  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const prev = await getConfig();
  const next = {
    telegramBotToken: String(req.body.telegramBotToken || '').trim() || prev.telegramBotToken,
    adminTelegramId: String(req.body.adminTelegramId || '').trim(),
    adminToken: String(req.body.adminToken || '').trim(),
  };

  if (!next.telegramBotToken) {
    return res.status(400).json({ error: 'telegramBotToken is required' });
  }

  await writeJson('config.json', next);

  const tokenChanged = prev.telegramBotToken !== next.telegramBotToken;
  const adminChanged = String(prev.adminTelegramId || '') !== String(next.adminTelegramId || '');

  if (tokenChanged || adminChanged || !getCurrentToken()) {
    await restartBotPolling({
      token: next.telegramBotToken,
      adminTelegramId: next.adminTelegramId,
    });
    await addLog('info', 'Bot restarted from admin config', {
      tokenChanged,
      adminChanged,
    });
  }

  return res.json({ ok: true, config: sanitizeConfig(next) });
});

app.get('/api/products', async (_req, res) => {
  const products = await readJson('products.json', []);
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  if (!(await isAuthorized(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Body must be array' });
  }

  const normalized = req.body.map((item, index) => ({
    id: item.id || `p${Date.now()}-${index}`,
    name: String(item.name || '').trim(),
    description: String(item.description || '').trim(),
    price: Number(item.price || 0),
    inStock: Boolean(item.inStock),
  }));

  await writeJson('products.json', normalized);
  await addLog('info', 'Products updated from admin page', { count: normalized.length });

  res.json({ ok: true, count: normalized.length });
});

app.get('/api/logs', async (req, res) => {
  const limit = Number(req.query.limit || 200);
  const logs = await getLogs(Number.isNaN(limit) ? 200 : limit);
  res.json(logs);
});

app.listen(PORT, async () => {
  console.log(`Local server started: http://localhost:${PORT}`);

  try {
    const cfg = await getConfig();
    if (cfg.telegramBotToken) {
      await startBotPolling({
        token: cfg.telegramBotToken,
        adminTelegramId: cfg.adminTelegramId,
      });
      console.log('Telegram bot polling started');
    } else {
      console.warn('Bot not started: set telegramBotToken in data/config.json or TELEGRAM_BOT_TOKEN in .env');
    }
  } catch (error) {
    console.warn(`Bot not started: ${error?.message || String(error)}`);
  }
});
