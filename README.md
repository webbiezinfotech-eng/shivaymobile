# Shivay Mobile

**Shivay Mobile** is a progressive web app (PWA) for managing daily sales, service, and accessories work at a mobile shop. It replaces the manual notebook used to track customer work, purchase costs, source vendors, profit, and payment settlements between staff and the shop owner.

> **Live demo:** [shivaymob.webbiezinfotech.in](https://shivaymob.webbiezinfotech.in)

This is **not** a full inventory system, ERP, POS, or accounting software. It is a focused digital notebook with role-based access, dashboards, and owner reports.

---

## What This App Does

Every work entry records:

| Field | Description |
|-------|-------------|
| Date | Entry date |
| Item / Work | What was sold or repaired |
| Customer / Party | Who the work was done for |
| Customer Amount | Amount charged to the customer |
| Purchase Cost | Cost paid to source shop (single value or item-wise breakdown) |
| Source Shop | Where parts/material came from |
| Profit | Auto-calculated: `customer_amount - purchase_cost` |
| Settlement | Pending or Settled (settlement amount = **customer amount**, not profit) |

---

## Features

### Sameer (Staff)

- Login with role-based access
- Dashboard with today’s summary
- **Add Entry** — item, customer, amount, purchase cost (or cost breakdown), source shop
- View own entries list and entry details
- Search entries on dashboard
- Mobile-friendly bottom navigation

### Owner

Everything Sameer can do, plus:

- **Add Entry** — same form as Sameer
- View **all entries** across the shop
- **Edit** any entry
- **Delete** entries (with confirmation)
- **Settle** pending entries (with confirmation modal)
- **Pending Settlements** page
- **Reports** with filters:
  - Date range or month/year
  - Status (All / Pending / Settled)
  - **Smart name search** — search customer, source shop, or item in one box (no manual filter needed)
  - Auto-detects report type:
    - Source shop name → shows **purchase cost** totals (profit hidden)
    - Customer name → shows **customer amount** totals
    - Item name → item-wise summary
- **PDF export** — clean statement for customers/sources (no profit/cost columns in customer PDFs)
- **Change password**
- Dashboard with today + month stats and recent entries

### App-Wide

- **PWA** — install on phone like a native app (Android / iPhone)
- **Stay logged in** — 30-day session until logout
- **Auto-update PWA** — new version loads when app is reopened
- **Refresh on resume** — data updates when tab/app becomes visible (no heavy background polling)
- **Copyright footer** on all pages
- Offline entry save blocked with clear message (internet required)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS, React Router |
| PWA | vite-plugin-pwa, Workbox |
| Backend | PHP 8+, PDO, session-based auth |
| Database | MySQL (`shivay_mobile`) |
| PDF | Custom zero-dependency PDF generator (no jspdf) |

---

## Project Structure

```
ShivayMobile/
├── frontend/
│   ├── src/
│   │   ├── components/       Layout, entries, dashboard, common
│   │   ├── pages/
│   │   │   ├── sameer/       Dashboard, Add Entry, My Entries, Details
│   │   │   └── owner/        Dashboard, Entries, Pending, Reports, Edit, etc.
│   │   ├── routes/           ProtectedRoute, RoleRoute
│   │   ├── services/         api, auth, entry, dashboard
│   │   ├── context/          AuthContext (session + localStorage cache)
│   │   └── utils/            reportBuilder, reportPdf, validation, formatters
│   ├── public/icons/         PWA icons
│   └── dist/                 Production build (deploy this)
├── backend/
│   ├── config/               database, session, config, local.php
│   ├── middleware/           auth, role
│   ├── auth/                 login, logout, me, change_password
│   ├── entries/              create, list, details, update, delete, settle
│   ├── dashboard/            sameer, owner
│   ├── reports/              monthly
│   └── helpers/              response, validation, security, entry_formatter
└── database/
    ├── schema.sql
    └── seed.sql
```

---

## Roles & Permissions

| Action | Sameer | Owner |
|--------|--------|-------|
| Add entry | ✅ | ✅ |
| View own entries | ✅ | ✅ |
| View all entries | ❌ | ✅ |
| Edit entry | ❌ | ✅ |
| Delete entry | ❌ | ✅ |
| Settle entry | ❌ | ✅ |
| Dashboard (full) | ❌ | ✅ |
| Reports & PDF | ❌ | ✅ |
| Change password | ❌ | ✅ |

---

## Business Rules

| Value | Rule |
|-------|------|
| Profit | `customer_amount - purchase_cost` |
| Settlement amount | `customer_amount` (NOT profit, NOT purchase cost) |
| Source report total | Sum of **purchase cost** only |
| Customer report total | Sum of **customer amount** |
| Customer PDF | Shows date, item, amount only (no profit/cost/status) |
| Source PDF | Shows date, item, **purchase cost** |

**Example:** Customer ₹1000, Purchase cost ₹600 → Profit ₹400, Settlement ₹1000

---

## Database Setup

1. Start MySQL (XAMPP / hosting panel).

2. Import schema and seed:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Or use the PHP seeder:

```bash
php backend/setup/seed_users.php
```

---

## Local Development Setup

### 1. Backend (PHP)

```bash
cp backend/config/local.example.php backend/config/local.php
```

Edit `backend/config/local.php`:

```php
<?php
return [
    'DB_HOST' => '127.0.0.1',
    'DB_NAME' => 'shivay_mobile',
    'DB_USER' => 'root',
    'DB_PASSWORD' => '',
];
```

Place project in XAMPP htdocs, e.g. `htdocs/ShivayMobile/`.

API base: `http://localhost/ShivayMobile/backend/`

### 2. Frontend (React)

```bash
cd frontend
cp .env.example .env.development   # if available
npm install
npm run dev
```

Dev server: `http://localhost:5173` (proxies `/backend` to XAMPP)

### Environment Variables

**Frontend** (`.env.production`):

```env
VITE_API_BASE_URL=/backend
```

**Backend** (`backend/config/local.php`):

- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

> Never commit `local.php` or production credentials to GitHub.

---

## Build & Deploy

```bash
cd frontend
npm run build
```

Upload to server:

1. `frontend/dist/` → web root
2. `backend/` → `/backend/` folder on same domain
3. Configure `backend/config/local.php` with production DB
4. Import `database/schema.sql` + create users
5. Enable HTTPS (recommended for PWA + secure cookies)

**Production URL example:** `https://shivaymob.webbiezinfotech.in`

---

## API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/backend/auth/login.php` | Public |
| POST | `/backend/auth/logout.php` | Authenticated |
| GET | `/backend/auth/me.php` | Authenticated |
| POST | `/backend/auth/change_password.php` | Owner |
| POST | `/backend/entries/create.php` | Sameer, Owner |
| GET | `/backend/entries/list.php` | Authenticated |
| GET | `/backend/entries/details.php?id=` | Authenticated |
| POST | `/backend/entries/update.php` | Owner |
| POST | `/backend/entries/delete.php` | Owner |
| POST | `/backend/entries/settle.php` | Owner |
| GET | `/backend/dashboard/sameer.php` | Sameer |
| GET | `/backend/dashboard/owner.php` | Owner |
| GET | `/backend/reports/monthly.php` | Owner |

### List / Report query parameters

- `from_date`, `to_date`
- `year`, `month`
- `status` — `pending` / `settled`
- `search` — customer, source shop, or item name
- `page`, `limit`

---

## Default Development Credentials

| Role | Username | Password |
|------|----------|----------|
| Owner | `owner` | `owner123` |
| Sameer | `sameer` | `sameer123` |

**Change these before production.**

---

## PWA Installation

1. Open the app in Chrome (Android) or Safari (iPhone)
2. **Add to Home Screen**
3. App opens in standalone mode like a native app
4. Updates apply automatically when a new build is deployed and the app is reopened

---

## Security

- PHP session auth with HTTP-only cookies (30-day lifetime)
- Role checks on every protected API
- Prepared statements for all SQL queries
- Passwords hashed with `password_hash()`
- Sameer blocked from owner-only APIs (403)
- Settlement and delete require owner confirmation in UI
- API routes use `NetworkOnly` in service worker (no stale cached API data)

---

## Reports & PDF — How Search Works

1. Type any name in the search box (customer, source, or item)
2. App finds all matching records automatically
3. Report type is auto-detected:
   - **Source match** → Total Cost = purchase cost sum, profit hidden
   - **Customer match** → Customer amount, settled/pending totals
   - **Item match** → Item + source breakdown table
4. **Download PDF** generates a clean statement:
   - Customer reports → amounts only
   - Source reports → purchase costs only
   - Footer: `Copyright 2026 webbiezinfotech.in All Rights Reserved`

---

## Development Commands

```bash
cd frontend
npm run dev       # Dev server
npm run build     # Production build
npm run preview   # Preview production build locally
```

---

## Testing Checklist

- [ ] Owner and Sameer login / logout
- [ ] Sameer adds entry; profit auto-calculated
- [ ] Owner adds, edits, deletes, settles entries
- [ ] Sameer cannot access owner routes (redirect / 403)
- [ ] Reports: date filter, status filter, name search
- [ ] Source search shows purchase cost (not customer amount)
- [ ] Customer search shows customer amounts
- [ ] PDF downloads with correct amounts and footer
- [ ] PWA installs and stays logged in after reopen
- [ ] Change default passwords before going live

---

## License & Credits

© Copyright 2026 [webbiezinfotech.in](https://webbiezinfotech.in) — All Rights Reserved

Private business application built for **Shivay Mobile**.
