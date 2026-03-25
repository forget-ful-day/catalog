const body = document.getElementById('productsBody');
const logsBox = document.getElementById('logs');
const cfgInfo = document.getElementById('cfgInfo');

function getAuthHeaders() {
  const token = localStorage.getItem('adminToken') || '';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
  };
}

function rowTemplate(item = {}) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" data-key="id" value="${item.id || ''}" /></td>
    <td><input type="text" data-key="name" value="${item.name || ''}" /></td>
    <td><input type="text" data-key="description" value="${item.description || ''}" /></td>
    <td><input type="number" data-key="price" value="${item.price || 0}" /></td>
    <td style="text-align:center"><input type="checkbox" data-key="inStock" ${item.inStock ? 'checked' : ''} /></td>
    <td><button data-action="remove">X</button></td>
  `;

  tr.querySelector('[data-action="remove"]').addEventListener('click', () => tr.remove());
  return tr;
}

function collectRows() {
  return [...body.querySelectorAll('tr')].map((tr) => ({
    id: tr.querySelector('[data-key="id"]').value.trim() || undefined,
    name: tr.querySelector('[data-key="name"]').value.trim(),
    description: tr.querySelector('[data-key="description"]').value.trim(),
    price: Number(tr.querySelector('[data-key="price"]').value || 0),
    inStock: tr.querySelector('[data-key="inStock"]').checked,
  }));
}

async function withAuthRetry(requestFn) {
  let res = await requestFn();
  if (res.status !== 401) {
    return res;
  }

  const newToken = prompt('Введите ADMIN_TOKEN');
  if (!newToken) {
    return res;
  }

  localStorage.setItem('adminToken', newToken);
  res = await requestFn();
  return res;
}

async function loadConfig() {
  const res = await withAuthRetry(() => fetch('/api/config', { headers: getAuthHeaders() }));
  if (!res.ok) {
    cfgInfo.textContent = 'Не удалось загрузить конфиг';
    return;
  }

  const cfg = await res.json();
  document.getElementById('adminTelegramId').value = cfg.adminTelegramId || '';
  cfgInfo.textContent = cfg.hasTelegramBotToken
    ? `Текущий токен: ${cfg.telegramBotTokenMasked}`
    : 'Токен бота не задан';
}

async function saveConfig() {
  const payload = {
    telegramBotToken: document.getElementById('telegramBotToken').value.trim(),
    adminTelegramId: document.getElementById('adminTelegramId').value.trim(),
    adminToken: document.getElementById('adminToken').value,
  };

  if (payload.adminToken) {
    localStorage.setItem('adminToken', payload.adminToken);
  }

  const res = await withAuthRetry(() =>
    fetch('/api/config', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
  );

  if (!res.ok) {
    alert('Ошибка сохранения конфигурации');
    return;
  }

  document.getElementById('telegramBotToken').value = '';
  alert('Настройки сохранены, бот перезапущен при необходимости');
  await loadConfig();
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  body.innerHTML = '';
  products.forEach((item) => body.appendChild(rowTemplate(item)));
}

async function saveProducts() {
  const rows = collectRows();

  const res = await withAuthRetry(() =>
    fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rows),
    })
  );

  if (!res.ok) {
    alert('Ошибка при сохранении товаров');
    return;
  }

  alert('Товары сохранены');
}

async function loadLogs() {
  const res = await fetch('/api/logs?limit=200');
  const logs = await res.json();
  logsBox.textContent = logs
    .map((log) => `[${log.ts}] ${log.level.toUpperCase()} ${log.message} ${JSON.stringify(log.meta)}`)
    .join('\n');
}

document.getElementById('saveConfig').addEventListener('click', saveConfig);
document.getElementById('addRow').addEventListener('click', () => body.appendChild(rowTemplate()));
document.getElementById('save').addEventListener('click', saveProducts);
document.getElementById('reload').addEventListener('click', loadProducts);
document.getElementById('reloadLogs').addEventListener('click', loadLogs);

loadConfig();
loadProducts();
loadLogs();
setInterval(loadLogs, 15000);
