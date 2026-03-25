const { Telegraf, Markup } = require('telegraf');
const { readJson } = require('./storage');
const { addLog } = require('./logger');

const token = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_ID = String(process.env.ADMIN_TELEGRAM_ID || '').trim();

let bot;
let pollingStarted = false;

function formatProduct(product) {
  const stock = product.inStock ? '✅ В наличии' : '❌ Нет в наличии';
  return `*${product.name}*\n${product.description}\n💸 ${product.price} ₽\n${stock}`;
}

function isAdmin(ctx) {
  if (!ADMIN_TELEGRAM_ID) {
    return false;
  }
  return String(ctx.from?.id || '') === ADMIN_TELEGRAM_ID;
}

async function sendCatalog(ctx) {
  const products = await readJson('products.json', []);

  if (products.length === 0) {
    await ctx.reply('Каталог пока пуст.');
    return;
  }

  const buttons = products.map((item) => [
    Markup.button.callback(`${item.name} — ${item.price} ₽`, `view:${item.id}`),
  ]);

  await ctx.reply('Выберите товар:', Markup.inlineKeyboard(buttons));
}

function getBot() {
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  if (bot) {
    return bot;
  }

  bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await addLog('info', 'User started bot', {
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    await ctx.reply('Привет! Нажмите /catalog чтобы открыть каталог товаров.');
  });

  bot.command('catalog', async (ctx) => {
    await addLog('info', 'Catalog requested', {
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    await sendCatalog(ctx);
  });

  bot.command('admin', async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('Недостаточно прав.');
      return;
    }

    const port = process.env.PORT || 3000;
    await ctx.reply(
      `Админка: http://localhost:${port}\n` +
      'Если стоит ADMIN_TOKEN, отправляй его в интерфейсе при сохранении.'
    );
  });

  bot.action(/view:(.+)/, async (ctx) => {
    const productId = ctx.match[1];
    const products = await readJson('products.json', []);
    const product = products.find((p) => p.id === productId);

    await addLog('info', 'Product viewed', {
      userId: ctx.from?.id,
      username: ctx.from?.username,
      productId,
    });

    if (!product) {
      await ctx.answerCbQuery('Товар не найден');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.replyWithMarkdown(formatProduct(product));
  });

  bot.catch(async (err) => {
    await addLog('error', 'Bot error', { error: err?.message || String(err) });
  });

  return bot;
}

async function startBotPolling() {
  const instance = getBot();
  if (pollingStarted) {
    return instance;
  }

  await instance.launch();
  pollingStarted = true;
  await addLog('info', 'Bot polling started');

  process.once('SIGINT', () => instance.stop('SIGINT'));
  process.once('SIGTERM', () => instance.stop('SIGTERM'));

  return instance;
}

module.exports = { getBot, startBotPolling };
