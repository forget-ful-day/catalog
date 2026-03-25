const body = document.getElementById('productsBody');
const logsBox = document.getElementById('logs');

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
  return [...body.querySelectorAll('tr')].map((tr) => {
    const id = tr.querySelector('[data-key="id"]').value.trim();
    const name = tr.querySelector('[data-key="name"]').value.trim();
    const description = tr.querySelector('[data-key="description"]').value.trim();
    const price = Number(tr.querySelector('[data-key="price"]').value || 0);
    const inStock = tr.querySelector('[data-key="inStock"]').checked;

    return {
      id: id || undefined,
      name,
      description,
      price,
      inStock,
    };
  });
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  body.innerHTML = '';
  products.forEach((item) => body.appendChild(rowTemplate(item)));
}

async function saveProducts() {
  const token = localStorage.getItem('adminToken') || '';
  const rows = collectRows();

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = prompt('Введите ADMIN_TOKEN');
      if (newToken) {
        localStorage.setItem('adminToken', newToken);
      }
    }
    alert('Ошибка при сохранении');
    return;
  }

  alert('Сохранено');
}

async function loadLogs() {
  const res = await fetch('/api/logs?limit=200');
  const logs = await res.json();
  logsBox.textContent = logs
    .map((log) => `[${log.ts}] ${log.level.toUpperCase()} ${log.message} ${JSON.stringify(log.meta)}`)
    .join('\n');
}

document.getElementById('addRow').addEventListener('click', () => {
  body.appendChild(rowTemplate());
});

document.getElementById('save').addEventListener('click', saveProducts);
document.getElementById('reload').addEventListener('click', loadProducts);
document.getElementById('reloadLogs').addEventListener('click', loadLogs);

loadProducts();
loadLogs();
setInterval(loadLogs, 15000);
