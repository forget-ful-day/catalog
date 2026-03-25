const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const TMP_DIR = '/tmp';

async function resolveDataFile(fileName) {
  if (!process.env.VERCEL) {
    return path.join(DATA_DIR, fileName);
  }

  const source = path.join(DATA_DIR, fileName);
  const target = path.join(TMP_DIR, `catalog-${fileName}`);

  try {
    await fs.access(target);
  } catch {
    const content = await fs.readFile(source, 'utf8');
    await fs.writeFile(target, content, 'utf8');
  }

  return target;
}

async function readJson(fileName, fallback = []) {
  const filePath = await resolveDataFile(fileName);
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(fileName, value) {
  const filePath = await resolveDataFile(fileName);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
  return filePath;
}

module.exports = {
  readJson,
  writeJson,
};
