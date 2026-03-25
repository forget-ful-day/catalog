const { Telegraf, Markup } = require('telegraf');
const { readJson } = require('./storage');
const { addLog } = require('./logger');

const token = process.env.TELEGRAM_BOT_TOKEN;

let bot;

function formatProduct(product) {
  const stock = product.inStock ? '✅ В наличии' : '❌ Нет в наличии';
  return `*${product.name}*\n${product.description}\n💸 ${product.price} ₽\n${stock}`;
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

    await ctx.reply(
      'Привет! Это бот с каталогом товаров. Нажмите /catalog чтобы открыть список.'
    );
  });

  bot.command('catalog', async (ctx) => {
    await addLog('info', 'Catalog requested', {
      userId: ctx.from?.id,
      username: ctx.from?.username,
    });

    await sendCatalog(ctx);
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
    await addLog('error', 'Bot error', {
      error: err?.message || String(err),
    });
  });

  return bot;
}

module.exports = { getBot };
