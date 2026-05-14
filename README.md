# AutoVault 🚗
### Digital Garage — Final Year Project

A premium, full-stack vehicle management application built from scratch using **Vanilla HTML/CSS/JavaScript** and a **Node.js/MongoDB** backend.

---

## ✨ Features
- **Authentication** — Secure JWT login/register with HttpOnly cookies
- **My Garage** — Add, edit, and delete vehicles with image support
- **Maintenance Log** — Track every service with due-date alerting
- **Fuel Tracker** — Log refuels with trend visualization (Chart.js)
- **Expenses** — Categorize and track all vehicle costs with monthly charts
- **Dashboard** — Real-time stats aggregated across all modules

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5, CSS3 (Custom Variables), ES6+ JavaScript Modules |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT + Secure HttpOnly Cookies |
| Charts | Chart.js |
| Icons | Phosphor Icons |

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd AutoVault-V2/backend
npm install

# Copy and configure the environment file
cp .env.example .env
# -> Edit .env with your MongoDB Atlas URI and JWT secret

# Start the server
npm run dev
```

### 2. Seed the Database (Optional)

```bash
npm run seed
# Creates demo@autovault.app / password123 with sample data
```

### 3. Frontend Setup

The frontend is a static single-page application. You can serve it with any static file server:

```bash
# Using VS Code Live Server: Right-click index.html → Open with Live Server
# OR using npx:
npx serve AutoVault-V2/frontend
```

> **Important**: Make sure the `CLIENT_URL` in your `.env` matches the address Live Server gives you (usually `http://127.0.0.1:5500`).

---

## 🗂️ Project Structure

```
AutoVault-V2/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT protection
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Maintenance.js
│   │   ├── Fuel.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   ├── maintenance.js
│   │   ├── fuel.js
│   │   ├── expenses.js
│   │   └── dashboard.js
│   ├── .env.example
│   ├── seed.js
│   └── server.js
└── frontend/
    ├── css/
    │   ├── variables.css       # Design tokens
    │   ├── global.css          # Resets & base
    │   ├── components.css      # All UI components
    │   └── auth.css            # Login page styles
    ├── js/
    │   ├── api.js              # Centralized fetch() client
    │   ├── utils.js            # Toast, formatting helpers
    │   ├── app.js              # SPA router & app shell
    │   ├── dashboard.js
    │   ├── garage.js
    │   ├── maintenance.js
    │   ├── fuel.js
    │   ├── expenses.js
    │   └── profile.js
    └── index.html
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/vehicles` | List / Create vehicles |
| GET/PUT/DELETE | `/api/vehicles/:id` | Read / Update / Delete vehicle |
| GET/POST | `/api/maintenance` | List / Create maintenance records |
| GET/POST | `/api/fuel` | List / Create fuel entries |
| GET/POST | `/api/expenses` | List / Create expense entries |
| GET | `/api/dashboard/stats` | Aggregated dashboard data |

---

## 🎨 Design System

- **Palette**: Ink `#0D1321` / Space `#1D2D44` / Slate `#3E5C76` / Eggshell `#F0EBD8`
- **Fonts**: `Outfit` (Headings) + `Manrope` (Body)
- **Aesthetic**: Dark Glassmorphism with `backdrop-filter: blur`
