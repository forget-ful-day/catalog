const { readJson, writeJson } = require('./_lib/storage');
const { addLog } = require('./_lib/logger');

function isAuthorized(req) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return true;
  }
  return req.headers['x-admin-token'] === adminToken;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const products = await readJson('products.json', []);
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
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
    await addLog('info', 'Products updated from admin page', {
      count: normalized.length,
    });

    return res.status(200).json({ ok: true, count: normalized.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
