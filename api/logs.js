const { getLogs } = require('./_lib/logger');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const limit = Number(req.query.limit || 200);
  const logs = await getLogs(Number.isNaN(limit) ? 200 : limit);
  return res.status(200).json(logs);
};
