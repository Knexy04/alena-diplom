
# Junior Camp CRM

CRM-система для детского лагеря «Junior Camp».

## Стек технологий

- **Frontend:** React 18 + TypeScript + Ant Design 5 + Vite
- **Backend:** NestJS + TypeORM + PostgreSQL 16
- **Real-time:** Socket.IO
- **Контейнеризация:** Docker + Docker Compose + Nginx

## Быстрый старт (Development)

### Предварительные требования

- Node.js 20+
- Docker и Docker Compose
- npm

### 1. Клонирование и настройка

```bash
cd junior-camp-crm
cp .env.example .env
```

### 2. Запуск через Docker Compose

```bash
docker-compose up --build
```

Сервисы:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- PostgreSQL: localhost:5432

### 3. Запуск миграций и seed-данных

```bash
# В контейнере backend
docker exec -it juniorcamp-backend npm run migration:run
docker exec -it juniorcamp-backend npm run seed
```

### 4. Локальный запуск (без Docker)

```bash
# Запустите PostgreSQL отдельно, затем:

# Backend
cd backend
npm install
npm run migration:run
npm run seed
npm run start:dev

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev
```

## Тестовые аккаунты

| Роль     | Email                  | Пароль      |
|----------|------------------------|-------------|
| Менеджер | admin@juniorcamp.ru    | password123 |
| Менеджер | manager@juniorcamp.ru  | password123 |
| Родитель | ivanov@mail.ru         | password123 |
| Родитель | petrova@mail.ru        | password123 |
| Родитель | sidorov@mail.ru        | password123 |

## Production

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

Приложение будет доступно на порту 80 через Nginx.

## Структура проекта

```
junior-camp-crm/
├── backend/          # NestJS API
├── frontend/         # React SPA
├── nginx/            # Nginx конфигурация
├── docker-compose.yml        # Dev окружение
├── docker-compose.prod.yml   # Production окружение
└── .env.example              # Переменные окружения
```

## Основной функционал

- Аутентификация (JWT access + refresh tokens)
- Управление заявками (CRUD, фильтрация, пагинация, воронка статусов)
- Карточки клиентов (родители + дети)
- Загрузка и скачивание документов
- Чат между менеджером и родителем (WebSocket, Socket.IO)
- Массовая рассылка уведомлений по сменам
- Личный кабинет родителя
- RBAC (менеджер / родитель)
