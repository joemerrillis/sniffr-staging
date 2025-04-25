# Sniffr Backend

**A modular Fastify + Supabase API** powering the Sniffr dog-walking SaaS platform.

---

## 🚀 Overview
Sniffr is a white-label, multi-tenant backend for dog-walking businesses. Features include:

- **Tenant & User Management** (Admin, Walkers, Clients)
- **Dog & Friendship** social layer
- **Walks**: scheduling, rescheduling, reporting, metrics
- **Boarding & Daycare** booking with tiered pricing
- **Purchases & Credits** (Stripe integration)
- **Calendar Sync** (Google/Outlook)
- **Park Check-ins & Social Feed**
- **AI-powered Suggestions** (RPC hooks)
- **Client Intake & Waitlist**, **Meet-and-Greet Scheduler**
- **B2B Referrals**, **In-App Messaging**, **Emergency Alerts**
- **Feature Flag** toggles per tenant
- **Cart & Checkout**, **Social Community Hub**

This repo is organized into **plugin** and **route** modules, making it easy to maintain and extend.

---

## 🛠️ Prerequisites
- **Node.js** >=16
- A **Supabase** project with:
  - Tables matching the schema in `/db/schema.sql`
  - RPC functions: `get_schedule_suggestions`, `get_booking_suggestions`, `get_weekly_summary`, `generate_collage`, `generate_social_post`
- A **Service Role** API key from Supabase

---

## 📥 Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/your-org/sniffr-backend.git
   cd sniffr-backend
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Fill in `.env`:
   ```ini
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   PORT=3000
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

---

## 🚀 Running Locally
- **Development** (with auto-reload using nodemon):
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

The server listens on `http://localhost:${process.env.PORT}` by default.

---

## 📁 Folder Structure
```
src/
├── index.js                  # App entrypoint, wires plugins & routes
├── plugins/
│   └── supabase.js           # Fastify plugin for Supabase client
└── routes/
    ├── auth.js
    ├── tenants.js
    ├── users.js
    ├── dogs.js
    ├── walks.js
    ├── boardings.js
    ├── purchases.js
    ├── calendar.js
    ├── parks.js
    ├── media.js
    ├── notifications.js
    ├── features.js
    └── social.js
```

---

## 📦 Environment Variables
| Key                            | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| `SUPABASE_URL`                 | Your Supabase project URL                        |
| `SUPABASE_SERVICE_ROLE_KEY`    | Supabase service-role API key (full privileges)  |
| `PORT`                         | Port to run the Fastify server (default: 3000)   |

---

## 🎯 API Endpoints
This backend exposes RESTful and RPC endpoints under several categories. Example highlights:

- **Auth**: `/auth/signup`, `/auth/login`, `/auth/me`
- **Tenants**: `/tenants`, `/tenants/:id`
- **Users**: `/tenants/:id/users`, `/users/:id`
- **Dogs**: `/tenants/:id/dogs`, `/dogs/:id/friends`
- **Walks**: `/walks`, `/walks/:id`, `/walks/:id/report`, `/metrics/:dogId`
- **Boardings**: `/boardings`, `/boardings/:id`
- **Calendar**: `/calendar/connect`, `/calendar/events/:userId`
- **AI RPCs**: `/ai/schedule-suggestions`, `/ai/booking-suggestions`
- **Social**: `/checkin`, `/social/feed`
- **And more...**

Refer to the `src/routes/*.js` files for full details.

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m "feat: add my feature"`)
4. Push (`git push origin feat/my-feature`)
5. Open a Pull Request

Please follow conventional commits and include tests for new functionality.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
