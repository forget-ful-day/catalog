const { readJson, writeJson } = require('./storage');

const LOG_FILE = 'logs.json';
const MAX_LOGS = 1000;

async function addLog(level, message, meta = {}) {
  const logs = await readJson(LOG_FILE, []);
  logs.push({
    ts: new Date().toISOString(),
    level,
    message,
    meta,
  });

  const trimmed = logs.slice(-MAX_LOGS);
  await writeJson(LOG_FILE, trimmed);
}

async function getLogs(limit = 200) {
  const logs = await readJson(LOG_FILE, []);
  return logs.slice(-limit).reverse();
}

module.exports = {
  addLog,
  getLogs,
};
