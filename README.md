# Shivay Mobile

Digital notebook for **Shivay Mobile** to manage Sameer's repair/accessory work and settlement tracking with the shop owner.

This is **not** an inventory system, ERP, POS, or accounting software. It replaces the manual notebook used to track work entries and whether Sameer has returned customer amounts to the owner.

## Features

- **Sameer role**: Add entries, view dashboard and own entries (no edit, delete, or settle)
- **Owner role**: View all entries, filter/search, mark pending as settled, dashboards, monthly reports
- **Automatic profit**: `profit = customer_amount - purchase_cost`
- **Settlement tracking**: Pending → Settled (settlement amount = customer amount)
- **Settlement confirmation modal** before marking settled
- **Mobile-first PWA** with bottom navigation
- **No advance money system**

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router, vite-plugin-pwa |
| Backend | PHP 8+, PDO, session auth |
| Database | MySQL (`shivay_mobile`) |

## Folder Structure

```
Shivay Mobile/
├── frontend/
│   ├── src/
│   │   ├── components/   Layout, common, dashboard, entries, auth
│   │   ├── pages/        Login, sameer/*, owner/*
│   │   ├── routes/       AppRoutes, ProtectedRoute, RoleRoute
│   │   ├── services/     api, auth, entry, dashboard
│   │   ├── context/      AuthContext
│   │   └── utils/        calculations, formatters, validation
│   ├── public/icons/     PWA icons
│   └── dist/             Production build output
├── backend/
│   ├── config/           database, session, config
│   ├── middleware/       auth, role
│   ├── auth/             login, logout, me
│   ├── entries/          create, list, details, settle
│   ├── dashboard/        sameer, owner
│   ├── reports/          monthly
│   └── helpers/          response, validation, security
└── database/
    ├── schema.sql
    └── seed.sql
```

## Database Setup

1. Start MySQL in XAMPP.

2. Import schema and seed:
```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/schema.sql
/Applications/XAMPP/xamppfiles/bin/mysql -u root < database/seed.sql
```

Alternatively, run the PHP seeder (updates passwords safely):
```bash
php backend/setup/seed_users.php
```

## PHP Setup

1. Ensure Apache and PHP 8+ are running in XAMPP.

2. Copy backend config example:
```bash
cp backend/config/local.example.php backend/config/local.php
```

3. Edit `backend/config/local.php`:
```php
return [
    'DB_HOST' => '127.0.0.1',
    'DB_NAME' => 'shivay_mobile',
    'DB_USER' => 'root',
    'DB_PASSWORD' => '',
];
```

API base URL (XAMPP): `http://localhost/Shivay%20Mobile/backend/`

## Frontend Setup

```bash
cd frontend
cp .env.example .env.development
npm install
npm run dev
```

Development: `http://localhost:5173` (proxies `/backend` to XAMPP)

## Environment Variables

### Frontend (`frontend/.env.development` or `.env.production`)

```env
VITE_API_BASE_URL=/backend
```

Production XAMPP example:
```env
VITE_API_BASE_URL=/Shivay%20Mobile/backend
```

### Backend (`backend/config/local.php`)

- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Never commit `backend/config/local.php` with production credentials.

## Development Commands

```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## PWA Testing

```bash
cd frontend
npm run build
npm run preview
```

Verify in Chrome DevTools:
- **Application → Manifest** — valid manifest loads
- **Application → Service Workers** — registered
- **Lighthouse → PWA** — installability checks
- **Add to Home Screen** — standalone mode works

Offline entry creation is **not** supported. Show "Internet connection required to save entries."

## Default Development Credentials

| Role   | Username | Password   |
|--------|----------|------------|
| Owner  | owner    | owner123   |
| Sameer | sameer   | sameer123  |

**Change these before production.**

## Production Deployment

1. Import database schema and seed users.
2. Configure `backend/config/local.php`.
3. Set `frontend/.env.production` with correct `VITE_API_BASE_URL`.
4. Build frontend: `npm run build`
5. Serve `frontend/dist/` via Apache on same domain as backend.
6. Enable HTTPS and ensure session cookies use `secure = true`.

## API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/backend/auth/login.php` | Public |
| POST | `/backend/auth/logout.php` | Authenticated |
| GET | `/backend/auth/me.php` | Authenticated |
| POST | `/backend/auth/change_password.php` | Owner |
| POST | `/backend/entries/create.php` | Sameer |
| GET | `/backend/entries/list.php` | Authenticated |
| GET | `/backend/entries/details.php?id=` | Authenticated |
| POST | `/backend/entries/settle.php` | Owner |
| GET | `/backend/dashboard/sameer.php` | Sameer |
| GET | `/backend/dashboard/owner.php` | Owner |
| GET | `/backend/reports/monthly.php?year=&month=` | Owner |

### List query parameters

- `from_date`, `to_date`
- `search` (item, customer, source shop)
- `status` (pending / settled)
- `page`, `limit`

## Business Calculations

| Value | Formula |
|-------|---------|
| Profit | `customer_amount - purchase_cost` |
| Settlement amount | `customer_amount` (NOT profit, NOT purchase cost) |

Example: Customer ₹90, Cost ₹20 → Profit ₹70, Settlement ₹90

## Security Notes

- PHP session authentication with HTTP-only cookies
- Role authorization on every protected endpoint
- Prepared statements for all SQL
- Passwords hashed with `password_hash()`
- No credentials in frontend or localStorage
- Sameer cannot access owner APIs (403)
- Settlement requires owner confirmation click

## Production Security Checklist

Before going live:

- [ ] Change default passwords (`owner123`, `sameer123`)
- [ ] Set `APP_DEBUG=false` in server environment
- [ ] Enable HTTPS; session cookies will use `secure = true`
- [ ] Configure `backend/config/local.php` with production DB credentials
- [ ] Do not commit `local.php` or `.env.production`
- [ ] Restrict database user permissions to `shivay_mobile` only
- [ ] Verify Sameer receives 403 on owner APIs (run `bash backend/tests/api_audit.sh`)

## Testing & Audit

### Automated tests (requires MySQL)

```bash
# Import database first
mysql -u root < database/schema.sql
mysql -u root < database/seed.sql

# Run PHP audit (calculations, schema, aggregations)
php backend/tests/audit.php

# Run API security audit (requires Apache running)
bash backend/tests/api_audit.sh
```

### Manual test checklist

- Owner and Sameer login/logout
- Sameer creates entry; profit auto-calculated
- Sameer cannot access `/owner` routes or settle API (403)
- Owner sees entries, filters, searches, settles with confirmation
- Settlement persists after browser refresh
- Dashboard totals: pending = sum of customer_amount (pending), settled = sum of customer_amount (settled)
- PWA: `npm run build` → manifest + service worker present

## License

Private use for Shivay Mobile.
# shivaymobile
# shivaymobile
