const { Telegraf, Markup } = require('telegraf');
const { readJson } = require('./storage');
const { addLog } = require('./logger');

let bot;
let pollingStarted = false;
let currentToken = '';
let currentAdminId = '';

function formatProduct(product) {
  const stock = product.inStock ? '✅ В наличии' : '❌ Нет в наличии';
  return `*${product.name}*\n${product.description}\n💸 ${product.price} ₽\n${stock}`;
}

function isAdmin(ctx) {
  if (!currentAdminId) {
    return false;
  }
  return String(ctx.from?.id || '') === String(currentAdminId);
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

function buildBot(token, adminTelegramId) {
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is empty');
  }

  const instance = new Telegraf(token);
  currentAdminId = adminTelegramId || '';

  instance.start(async (ctx) => {
    await addLog('info', 'User started bot', {
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    await ctx.reply('Привет! Нажмите /catalog чтобы открыть каталог товаров.');
  });

  instance.command('catalog', async (ctx) => {
    await addLog('info', 'Catalog requested', {
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    await sendCatalog(ctx);
  });

  instance.command('admin', async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.reply('Недостаточно прав.');
      return;
    }

    const port = process.env.PORT || 3000;
    await ctx.reply(`Админка: http://localhost:${port}`);
  });

  instance.action(/view:(.+)/, async (ctx) => {
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

  instance.catch(async (err) => {
    await addLog('error', 'Bot error', { error: err?.message || String(err) });
  });

  return instance;
}

async function startBotPolling({ token, adminTelegramId }) {
  if (!token) {
    throw new Error('Bot token is missing in config');
  }

  if (pollingStarted && bot) {
    return bot;
  }

  bot = buildBot(token, adminTelegramId);
  currentToken = token;
  await bot.launch();
  pollingStarted = true;
  await addLog('info', 'Bot polling started');

  process.once('SIGINT', () => bot && bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot && bot.stop('SIGTERM'));

  return bot;
}

async function restartBotPolling({ token, adminTelegramId }) {
  if (!token) {
    throw new Error('Bot token is missing in config');
  }

  if (pollingStarted && bot) {
    bot.stop('RESTART');
    pollingStarted = false;
    bot = null;
  }

  return startBotPolling({ token, adminTelegramId });
}

function getCurrentToken() {
  return currentToken;
}

module.exports = { startBotPolling, restartBotPolling, getCurrentToken };
