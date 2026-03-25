require('dotenv').config();

const express = require('express');
const path = require('node:path');
const { readJson, writeJson } = require('./api/_lib/storage');
const { addLog, getLogs } = require('./api/_lib/logger');
const { startBotPolling } = require('./api/_lib/bot');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

function isAuthorized(req) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return true;
  }
  return req.headers['x-admin-token'] === adminToken;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/products', async (_req, res) => {
  const products = await readJson('products.json', []);
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  if (!isAuthorized(req)) {
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
    await startBotPolling();
    console.log('Telegram bot polling started');
  } catch (error) {
    console.warn(`Bot not started: ${error?.message || String(error)}`);
  }
});
