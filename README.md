# Telegram Catalog Bot + Local Admin (Node.js)

Простой локальный проект:
- Telegram-бот с каталогом товаров
- Веб-админка для изменения товаров
- Логи действий
- Хранение в JSON (`data/products.json`, `data/logs.json`)

## 1) Установка

```bash
npm install
```

## 2) Настройка env

1. Скопируйте пример:
```bash
cp .env.example .env
```
2. Заполните `.env`:
- `TELEGRAM_BOT_TOKEN` — токен бота
- `ADMIN_TELEGRAM_ID` — ваш Telegram ID (для команды `/admin`)
- `ADMIN_TOKEN` — опционально, защита сохранения товаров из веб-админки
- `PORT` — опционально, порт (по умолчанию `3000`)

## 3) Запуск

```bash
npm run dev
```

После запуска:
- Админка: `http://localhost:3000`
- Health: `GET /api/health`
- API:
  - `GET /api/products`
  - `POST /api/products`
  - `GET /api/logs`

## 4) Бот

- `/start` — приветствие
- `/catalog` — показать товары
- `/admin` — ссылка на локальную админку (только для `ADMIN_TELEGRAM_ID`)

## Безопасность

Не коммитьте `.env` в git. Если токен бота случайно попал в публичный чат/репозиторий — перевыпустите его через @BotFather.
