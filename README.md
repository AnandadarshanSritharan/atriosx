# ⚡ ATRIOS ENTERTAINMENT — Full-Stack Web Application

> **Official Visual Identity:** Dark, futuristic, metallic silver on black, inspired directly by the official Atrios Entertainment logo.  
> **Architecture:** Decoupled Full-Stack (`/client` + `/server`), strictly dynamic, zero hardcoded business data.

---

## 🎮 System Overview & Acceptance Verification

The system has been verified against the exact acceptance scenario:
1. **Admin Login:** Authentication via JWT with bcrypt encryption. Default superadmin: `admin@atrios.lk` / `Admin@123`.
2. **Dynamic Resources:** PS5 1, PS5 2, Cockpit 1, Cockpit 2, Table Tennis 1, Carrom Board 1 loaded dynamically from MongoDB. Adding or modifying facilities in the Admin panel propagates everywhere without frontend code changes.
3. **5-Step Guest Booking Engine:** Facility selection → Date Picker → Real-time Slot Availability → Customer Details → Pay-at-Venue Confirmation (no mandatory account registration or online gateway required).
4. **Booking Conflict Prevention:** Atomic overlap detection strictly rejects conflicting bookings (e.g. 19:30–20:30 overlaps with 19:00–20:00) with HTTP 409 Conflict.
5. **Resource-Timeline Calendar:** Outlook-style FullCalendar resource timeline view with real-time slot selection, status coloring, and direct phone/walk-in booking modal.
6. **Check-In & Status Tracking:** One-click customer check-in and session completion tracking.
7. **Operating Expenses Ledger:** Categorized expenses (Rent, Electricity, Maintenance, etc.) with receipt tracking.
8. **Financial Profit & 4-Partner Distribution Engine:** Gross Revenue minus Operating Expenses equals Distributable Net Profit, automatically allocated across 4 business partners by dynamic investment equity (40%, 30%, 20%, 10%) or manual assignment.
9. **ExcelJS Export Engine:** Full-fidelity `.xlsx` exports for Bookings, Expenses, Revenue, and Profit Distribution.

---

## 🛠 Tech Stack

### Frontend (`/client`)
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with Atrios Metallic Theme (`#0a0a0a` black, `#111111` surface, `#c0c0c0` metallic silver)
- **FullCalendar** (`@fullcalendar/resource-timeline`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`)
- **TanStack Query v5** (Server state, caching & revalidation)
- **Lucide Icons** & **Recharts**
- **Axios** with JWT interception

### Backend (`/server`)
- **Node.js** + **Express** + **TypeScript**
- **MongoDB** with **Mongoose** (Supports local MongoDB or zero-dependency embedded database fallback)
- **JWT** Authentication + **bcryptjs** (12 salt rounds)
- **ExcelJS** for enterprise `.xlsx` spreadsheet generation
- **Multer** for local/S3-ready file & photo uploads
- **Audit Logging** tracking all booking, financial, and pricing changes

---

## 🚀 Quick Start Guide

### 1. Start Backend Server
```powershell
cd d:\Atrios\server
npm run build
node dist/src/app.js
```
The server will start on `http://localhost:5000` and automatically connect to MongoDB (or launch the embedded MongoDB instance and auto-seed initial data).

### 2. Start Frontend Client
```powershell
cd d:\Atrios\client
npm run dev
```
The client will start on `http://localhost:5173`.

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@atrios.lk` | `Admin@123` |
| **Manager** | `manager@atrios.lk` | `Manager@123` |

---

## 🌐 Application Route Sitemap

### Public Portal
- `/` — Homepage (Hero, Experiences, Games showcase, Why Atrios, Offers, News, Contact)
- `/experiences` — Facilities and entertainment equipment catalogue
- `/book` — 5-Step interactive booking wizard
- `/games` — Games library searchable by title and platform
- `/offers` — Active promotional discounts
- `/news` — Lounge news and tournament announcements
- `/news/:slug` — Individual article reader
- `/contact` — Location, interactive enquiry form, and live business hours

### Admin Portal (`/admin`)
- `/admin/login` — Secure staff & manager authentication
- `/admin/dashboard` — Executive overview cards, 30-day revenue chart, recent bookings
- `/admin/bookings/calendar` — FullCalendar resource timeline (Outlook-style)
- `/admin/bookings` — Bookings list table with search, status filters, and Excel export
- `/admin/bookings/:id` — Booking detail view with audit trail timeline
- `/admin/customers` — Customer database tracking visit history, total spent, and no-shows
- `/admin/customers/:id` — Individual customer profile and booking ledger
- `/admin/facilities` — Facilities manager (active/inactive states, prices, colors)
- `/admin/facilities/new` — Create new entertainment resource
- `/admin/facilities/:id/edit` — Edit pricing, duration limits, and custom rules
- `/admin/games` — Games catalogue manager
- `/admin/offers` — Promotional discount campaigns
- `/admin/news` — Announcement publisher with slug generation
- `/admin/gallery` — Visual gallery manager
- `/admin/finance/revenue` — Gross revenue ledger and ancillary sales
- `/admin/finance/expenses` — Operating expenses ledger with Excel export
- `/admin/finance/partners` — 4 Business Partners capital structure & investment editor
- `/admin/finance/profit` — Net profit calculator and equity distribution table
- `/admin/reports` — Facility utilization %, revenue, expense, and profit reports
- `/admin/settings` — Operating hours, booking constraints, currency, and SEO settings
- `/admin/admin/users` — Role-based staff access management
- `/admin/admin/audit-logs` — Immutable audit trail of administrative modifications
