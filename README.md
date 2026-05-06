# FormNotify API

Open-source API for dynamic forms and notifications.

FormNotify lets you create dynamic forms, receive public submissions, and send notifications through webhooks or email.

---

# Features

- User authentication with JWT
- Multi-tenant organizations
- Dynamic form builder API
- Public form submissions
- Dynamic field validation
- Webhook notifications
- Email notification support
- Notification logs
- Rate limiting for public submissions
- MariaDB/MySQL support
- Prisma ORM
- Swagger API docs
- Docker Compose setup

---

# Tech Stack

- Node.js
- Express
- MariaDB / MySQL
- Prisma
- JWT
- Zod
- Nodemailer
- Swagger UI
- Docker Compose

---

# Requirements

- Node.js LTS
- Docker Desktop
- Git

---

# Installation

```bash
git clone https://github.com/Vlad-Timofti/formnotify-api.git
cd formnotify-api
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run dev
```

---

# Local URLs

API:

```txt
http://localhost:4000
```

Swagger docs:

```txt
http://localhost:4000/docs
```

phpMyAdmin:

```txt
http://localhost:8080
```

---

# Default Database

Docker Compose starts MariaDB with:

```txt
Database: formnotify
User: formnotify
Password: formnotify
Root password: root
```

For local migrations, the default `.env.example` uses root:

```env
DATABASE_URL="mysql://root:root@localhost:3306/formnotify"
```

---

# Create Account

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/auth/register" `
  -ContentType "application/json" `
  -Body '{
    "organizationName":"Demo Company",
    "name":"Admin",
    "email":"admin@test.com",
    "password":"123456"
  }'
```

---

# Login

```powershell
$login = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/auth/login" `
  -ContentType "application/json" `
  -Body '{
    "email":"admin@test.com",
    "password":"123456"
  }'

$token = $login.token
```

---

# Create Form

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/forms" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "title": "Contact Form",
    "description": "Basic contact form",
    "fields": [
      {
        "id": "full_name",
        "type": "text",
        "label": "Full Name",
        "required": true
      },
      {
        "id": "email",
        "type": "email",
        "label": "Email Address",
        "required": true
      },
      {
        "id": "message",
        "type": "textarea",
        "label": "Message",
        "required": false
      }
    ]
  }'
```

---

# List Forms

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4000/forms" `
  -Headers @{ Authorization = "Bearer $token" }
```

---

# Submit Public Form

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/public/forms/FORM_ID/submit" `
  -ContentType "application/json" `
  -Body '{
    "full_name": "Ion Popescu",
    "email": "ion@test.com",
    "message": "Hello from FormNotify."
  }'
```

---

# Create Webhook Notification Channel

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/notification-channels" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "type": "webhook",
    "name": "Test Webhook",
    "config": {
      "url": "https://webhook.site/YOUR_WEBHOOK_ID"
    }
  }'
```

---

# Create Email Notification Channel

```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/notification-channels" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json" `
  -Body '{
    "type": "email",
    "name": "Admin Email",
    "config": {
      "to": "admin@example.com"
    }
  }'
```

---

# Notification Logs

```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://localhost:4000/notification-channels/logs" `
  -Headers @{ Authorization = "Bearer $token" }
```

---

# Environment Variables

```env
PORT=4000

DATABASE_URL="mysql://root:root@localhost:3306/formnotify"

JWT_SECRET="change_this_secret"

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="FormNotify <no-reply@formnotify.local>"
```

---

# API Docs

Swagger documentation is available at:

```txt
http://localhost:4000/docs
```

---

# Roadmap

- API key authentication
- Better field validation rules
- File upload fields
- Discord notifications
- Telegram notifications
- Dashboard UI
- Form embed script
- Export submissions as CSV
- Dockerized production deployment

---

# License

MIT License

Copyright (c) 2026 FormNotify

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.