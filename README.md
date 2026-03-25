# Telegram Catalog Bot + Admin Web (Node.js, Vercel)

Проект включает:
- Telegram-бота с каталогом товаров (`/start`, `/catalog`)
- Веб-страницу админки для редактирования товаров
- Просмотр логов действий и ошибок
- Сохранение данных в JSON

## 1) Установка

```bash
npm install
```

## 2) Переменные окружения

Создайте `.env` (локально) или добавьте в Vercel:

- `TELEGRAM_BOT_TOKEN` — токен бота от @BotFather
- `TELEGRAM_WEBHOOK_URL` — полный URL webhook, например `https://your-app.vercel.app/api/webhook`
- `ADMIN_TOKEN` *(необязательно)* — токен для защиты изменения товаров

## 3) Локальный запуск

```bash
npm run dev
```

- Админка: `http://localhost:3000`
- API:
  - `GET /api/products`
  - `POST /api/products`
  - `GET /api/logs`
  - `POST /api/webhook`
  - `POST /api/set-webhook`

## 4) Деплой на Vercel

1. Запушьте репозиторий на GitHub.
2. Импортируйте проект в Vercel.
3. Добавьте env-переменные.
4. После деплоя вызовите:

```bash
curl -X POST https://your-app.vercel.app/api/set-webhook
```

## Важно про JSON на Vercel

На Vercel запись в обычные файлы проекта недоступна между холодными стартами, поэтому запись идёт во временный файл `/tmp/catalog-*.json`.
Это подходит для демо и теста. Для продакшена используйте внешнее хранилище (Vercel KV/Blob/DB).
