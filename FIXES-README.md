# Shivay Mobile — Bug Fix Build (server blank page + report name search)

## 1) Blank page on server  (ROOT CAUSE — runtime crash)
File: `frontend/src/pages/sameer/SameerDashboard.jsx`
- Component ne `usePagedList(...)` se `page, totalPages, pageItems...` destructure kiye,
  lekin JSX me `pager.page`, `pager.pageItems` etc. use ho raha tha.
- `pager` kahin define nahi tha -> `ReferenceError: pager is not defined` -> React tree crash
  -> poora page BLANK (staff login ke baad, aur `/` bhi kyunki HomePage same component render karta hai).
- Fix: sahi destructured variables use kiye.

## 2) Deep link / refresh par blank (404)
- React Router hai lekin `dist` me SPA rewrite nahi tha, isliye `/owner/reports` ya
  `/sameer/pending` direct open/refresh karne par 404 blank.
- Fix: `frontend/dist/.htaccess` (+ `frontend/.htaccess`, `frontend/public/.htaccess`) add kiya:
  SPA fallback to index.html, sw.js/manifest ka no-cache.

## 3) Pending me naam dikhta hai par Reports me search karne par kuch nahi
Root causes (teen, sab fix):
a) `backend/reports/monthly.php` sirf customer_name / source_shop / item_name par search karta tha.
   Staff/owner ke naam (`created_by_name`) par match hi nahi hota tha -> naam search = 0 rows.
   Fix: search me `created_by` user name bhi include (customer + all modes me).
b) `frontend/src/utils/formatters.js` -> default report filter **aaj ki date** tha.
   Purani pending entries isliye report me aati hi nahi thi.
   Fix: default = **All Time** (+ UI me "All Time" checkbox, date inputs disable ho jate hain).
c) `backend/reports/monthly.php` ab `all_time=1` support karta hai (date range skip).
   `frontend/src/utils/reportBuilder.js` + `MonthlyReport.jsx` bhi isko bhejte/handle karte hain.
d) Client-side list search (`frontend/src/utils/searchEntries.js`) ab `created_by_name` /
   `settled_by_name` par bhi match karta hai.

## 4) Pending list adhuri (100 cap)
`PendingSettlements.jsx`, `SameerPending.jsx`, `MyEntries.jsx`, `AllEntries.jsx`
me `limit: 100` -> `limit: 500` (backend max 100 tha -> 100 se zyada pending dikh hi nahi rahi thi).

## 5) Rebuilt
`frontend/dist` naye bundle ke saath rebuild kiya gaya hai (purana `pager` wala bug wala bundle hata diya).

## Upload kaise karein (Hostinger)
1. `backend/` ka poora folder -> `public_html/backend/` (overwrite).
2. `frontend/dist/` ka **andar ka content** -> `public_html/` (overwrite, `.htaccess` bhi).
   => `public_html/index.html`, `public_html/assets/`, `public_html/.htaccess`
3. `backend/config/local.php` me DB credentials already hain (change nahi kiye).
4. Browser me ek baar hard refresh / PWA: app band karke dobara kholein (purana service worker cache clear).

Note: `node_modules` zip me nahi hai (size kam rakhne ke liye). Dobara build karna ho to:
`cd frontend && npm ci && npm run build`
