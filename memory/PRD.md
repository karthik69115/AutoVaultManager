# AutoVault — Product Requirements (Living Doc)

## Original Problem Statement (verbatim, condensed)
AutoVault: a vehicle management web app (CRUD + dashboard) that lets users digitally manage their cars, track maintenance history, monitor fuel usage and control expenses. Dark premium dashboard, glassmorphism cards, strict palette: #0D1321, #1D2D44, #3E5C76, #748CAB, #F0EBD8. Spec originally called for Supabase + RLS, replaced here by FastAPI + MongoDB + JWT auth (with per-user scoping in every query).

## Architecture
- Backend: FastAPI + Motor (MongoDB). Single `server.py`. All routes prefixed `/api`. JWT in httpOnly cookie (`access_token`). Bcrypt password hashing. UUID string ids; `_id` excluded from responses.
- Frontend: React 19 + Tailwind + Framer Motion + Recharts + Phosphor (duotone) icons. Outfit (headings) / Manrope (body) fonts.
- Auth: AuthContext + axios `withCredentials: true`. Protected layout.
- Seeded users: `admin@autovault.app / admin12345`, `demo@autovault.app / demo12345` (3 vehicles, maintenance/fuel/expenses).

## Core Requirements (static)
- Auth (register/login/me/logout)
- Vehicles CRUD (user-scoped, cascade-delete child records)
- Maintenance / Fuel / Expenses CRUD (user-scoped, vehicle ownership validated)
- Dashboard stats (totals + upcoming services + recent activity)
- Search & filter (garage search, vehicle filter on log pages)
- Charts (line: refuel; bar: monthly expenses; pie: spend by category)
- Reminders surfaced via upcoming_services in dashboard

## User Personas
1. Individual car owner — wants one place for service + fuel + insurance dates.
2. Family with multiple vehicles — needs per-vehicle dashboards.
3. Ride-share driver — cares about fuel efficiency and total expense over time.

## Implemented (Feb 2026)
- [x] FastAPI backend with auth + 4 CRUD resources + dashboard stats
- [x] Demo + admin seeding with 3 vehicles + maintenance + fuel + expenses
- [x] React frontend: Dashboard, Garage (grid + dialog), Vehicle Detail (charts + timeline), Maintenance, Fuel, Expenses, Profile, Login/Register
- [x] Animated counters, framer-motion page transitions, glassmorphism, Phosphor icons
- [x] testing_agent_v3 iteration 1: 100% backend (13/13) + frontend smoke pass

## Backlog
- P1: Reminders page (insurance expiry surfacing + mileage-based)
- P1: Image upload for vehicles (object storage)
- P1: Bulk import (CSV) for fuel/expenses
- P2: AI maintenance prediction (Claude/GPT)
- P2: Fleet view for multi-vehicle households
- P2: PDF export of vehicle history

## Next Action Items
- Add insurance expiry reminders to dashboard alongside service reminders.
- Wire vehicle photo uploads via object storage.
- Polish empty states for first-time non-demo users.
