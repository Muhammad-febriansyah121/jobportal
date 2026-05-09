# Karivia

Karivia is a modern job portal platform built with Laravel 13, React, InertiaJS, Vite, Redis, and Docker.

---

# Tech Stack

- Laravel 13
- PHP 8.4
- React + InertiaJS
- Vite
- MariaDB 11
- Redis 7
- Docker Compose
- Nginx
- Let's Encrypt SSL

---

# Features

- Multi-role Authentication
- Employer Dashboard
- Candidate Dashboard
- AI Interview
- Messaging System
- WhatsApp Integration
- Resume/CV Upload
- Company Reviews
- Talent Pool
- Queue Worker
- Scheduler
- Redis Session & Cache
- reCAPTCHA Protection

---

# Production Architecture

```text
Internet
   ↓
Nginx Container
   ↓
Laravel App Container
   ↓
MariaDB + Redis
```

---

# Docker Services

| Service | Description |
|---|---|
| karivia-nginx | Reverse proxy + SSL |
| karivia-app | Laravel PHP-FPM |
| karivia-queue | Queue worker |
| karivia-scheduler | Laravel scheduler |
| karivia-db | MariaDB database |
| karivia-redis | Redis cache/session |

---

# Installation

## Clone Repository

```bash
git clone https://github.com/natadolay7/JobPortal.git
cd JobPortal
```

---

# Environment Setup

Copy environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
APP_NAME=Karivia
APP_ENV=production
APP_DEBUG=false
APP_URL=https://karivia.id

DB_CONNECTION=mysql
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=karivia
DB_USERNAME=karivia
DB_PASSWORD=passwordku

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=redis
REDIS_PORT=6379
```

---

# Docker Build

```bash
docker compose up -d --build
```

---

# Generate App Key

```bash
docker exec -it karivia-app php artisan key:generate
```

---

# Install Dependencies

```bash
docker exec -it karivia-app composer install
docker exec -it karivia-app pnpm install
docker exec -it karivia-app pnpm build
```

---

# Database Import

```bash
docker exec -i karivia-db mariadb -u root -prootpassword karivia < db_jobportal.sql
```

---

# Storage Link

```bash
docker exec -it karivia-app php artisan storage:link
```

---

# Optimize Laravel

```bash
docker exec -it karivia-app php artisan optimize:clear
docker exec -it karivia-app php artisan optimize
```

---

# SSL Setup

Install Certbot:

```bash
apt install certbot
```

Generate SSL:

```bash
certbot certonly --standalone -d karivia.id
```

---

# Useful Commands

## Restart Containers

```bash
docker compose restart
```

---

## View Logs

### App

```bash
docker logs -f karivia-app
```

### Queue

```bash
docker logs -f karivia-queue
```

### Nginx

```bash
docker logs -f karivia-nginx
```

---

## Laravel Commands

```bash
docker exec -it karivia-app php artisan migrate
docker exec -it karivia-app php artisan optimize:clear
docker exec -it karivia-app php artisan queue:restart
```

---

# Backup Database

```bash
docker exec karivia-db mariadb-dump -u root -prootpassword karivia > backup.sql
```

---

# Restore Database

```bash
docker exec -i karivia-db mariadb -u root -prootpassword karivia < backup.sql
```

---

# Troubleshooting

## 502 Bad Gateway

Restart nginx & app:

```bash
docker restart karivia-nginx
docker restart karivia-app
```

---

## Vite Manifest Missing

Run:

```bash
docker exec -it karivia-app pnpm build
```

---

## Storage 404

Run:

```bash
docker exec -it karivia-app php artisan storage:link
```

---

## Queue Not Running

Check logs:

```bash
docker logs -f karivia-queue
```

Restart queue:

```bash
docker restart karivia-queue
```

---

## Permission Issues

```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

---

# Security

- HTTPS Enabled
- HTTP/2 Enabled
- Content Security Policy (CSP)
- Redis Session
- reCAPTCHA
- Security Headers
- Docker Isolation

---

# License

Private Project
