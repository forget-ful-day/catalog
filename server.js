const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
  })
);

function readStore() {
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function writeStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function formatRub(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/');
  }
  return next();
}

app.use((req, res, next) => {
  const store = readStore();
  res.locals.siteTitle = store.settings.siteTitle;
  res.locals.logoText = store.settings.logoText;
  res.locals.isAdmin = Boolean(req.session.isAdmin);
  res.locals.formatRub = formatRub;
  next();
});

app.get('/', (req, res) => {
  const store = readStore();
  res.render('index', { products: store.products });
});

app.get('/product/:id', (req, res) => {
  const store = readStore();
  const product = store.products.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).send('Товар не найден');
  }

  return res.render('product', { product });
});

app.get('/go/:id', (req, res) => {
  const store = readStore();
  const product = store.products.find((item) => item.id === req.params.id);

  if (!product || !product.purchaseUrl) {
    return res.status(404).send('Ссылка для покупки не найдена');
  }

  return res.redirect(product.purchaseUrl);
});

app.post('/admin/login', (req, res) => {
  const { login, password } = req.body;
  const store = readStore();

  if (login === store.settings.admin.login && password === store.settings.admin.password) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  return res.redirect('/?authError=1');
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/admin', requireAdmin, (req, res) => {
  const store = readStore();
  res.render('admin', { products: store.products, settings: store.settings, error: null, success: null });
});

app.post('/admin/product', requireAdmin, (req, res) => {
  const store = readStore();
  const { id, title, description, image, purchaseUrl, price } = req.body;

  const newProduct = {
    id: `p${Date.now()}`,
    title,
    description,
    image,
    purchaseUrl,
    price: Number(price),
  };

  if (id) {
    const index = store.products.findIndex((item) => item.id === id);
    if (index !== -1) {
      store.products[index] = { ...store.products[index], ...newProduct, id };
    }
  } else {
    store.products.unshift(newProduct);
  }

  writeStore(store);
  res.redirect('/admin');
});

app.post('/admin/product/delete', requireAdmin, (req, res) => {
  const { id } = req.body;
  const store = readStore();
  store.products = store.products.filter((item) => item.id !== id);
  writeStore(store);
  res.redirect('/admin');
});

app.post('/admin/settings', requireAdmin, (req, res) => {
  const store = readStore();
  const { siteTitle, logoText } = req.body;

  store.settings.siteTitle = siteTitle;
  store.settings.logoText = logoText;

  writeStore(store);
  res.redirect('/admin');
});

app.post('/admin/credentials', requireAdmin, (req, res) => {
  const { currentPassword, newLogin, newPassword } = req.body;
  const store = readStore();

  if (currentPassword !== store.settings.admin.password) {
    return res.status(400).render('admin', {
      products: store.products,
      settings: store.settings,
      error: 'Текущий пароль введён неверно.',
      success: null,
    });
  }

  if (!newLogin || !newPassword) {
    return res.status(400).render('admin', {
      products: store.products,
      settings: store.settings,
      error: 'Новый логин и пароль обязательны.',
      success: null,
    });
  }

  store.settings.admin.login = newLogin;
  store.settings.admin.password = newPassword;
  writeStore(store);

  return res.status(200).render('admin', {
    products: store.products,
    settings: store.settings,
    error: null,
    success: 'Данные для входа обновлены.',
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
