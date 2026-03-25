# Telegram Catalog Bot + Local Admin (Node.js)

Локальный проект:
- Telegram-бот с каталогом товаров
- Веб-админка для изменения товаров
- Изменение токена бота прямо в админке
- Логи действий
- Хранение в JSON (`data/*.json`)

## 1) Установка

```bash
npm install
```

## 2) Быстрый старт

```bash
cp .env.example .env
npm run dev
```

Откройте `http://localhost:3000`.

## 3) Настройки в админке

В разделе **Настройки бота** можно изменить:
- `Telegram Bot Token`
- `Admin Telegram ID`
- `ADMIN_TOKEN`

После сохранения конфигурации бот автоматически перезапускается с новым токеном.

## 4) API

- `GET /api/health`
- `GET /api/config`
- `POST /api/config`
- `GET /api/products`
- `POST /api/products`
- `GET /api/logs`

## 5) JSON файлы

- `data/config.json` — токен и admin-настройки
- `data/products.json` — каталог
- `data/logs.json` — лог

## Безопасность

Если токен бота попадал в переписку/публичный доступ, обязательно перевыпустите его через @BotFather.
