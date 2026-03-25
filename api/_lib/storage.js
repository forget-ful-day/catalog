const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function dataFile(fileName) {
  await ensureDataDir();
  return path.join(DATA_DIR, fileName);
}

async function readJson(fileName, fallback = []) {
  const filePath = await dataFile(fileName);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(fileName, value) {
  const filePath = await dataFile(fileName);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
  return filePath;
}

module.exports = {
  readJson,
  writeJson,
};
