# Shivay Mobile — Fix Notes (02 Nov 2026)

Sirf 3 reported issues fix kiye gaye hain. Baaki poore project me koi aur change nahi kiya gaya.

## Fix 1 — Reports me customer ke saare transactions nahi dikh rahe the
**Problem:** All Entries me kisi customer (jaise Soni ji) ki saari entries dikhti thi,
lekin Reports me sirf 1 entry aati thi — bina kisi status/date filter ke.

**Root cause:** Report page search lagate waqt backend ki jagah frontend par hi
`/entries/list.php` ko `limit: 100` ke saath call karke client-side filtering +
client-side summary banata tha. Iska matlab:
- 100 se zyada entries hone par purani entries list se hi cut jati thi
- search waqt server ke proper customer-report query ka use hi nahi hota tha

**Fix (surgical):**
- `frontend/src/utils/reportBuilder.js` — `fetchOwnerReport()` ab HAMESHA
  backend `/reports/monthly.php` se full report laata hai. Backend already
  `from_date`, `to_date`, `status` aur `search` (customer/source/item) sab
  server-side filter karta hai, isliye poori matching list milti hai —
  koi 100-entry cap nahi, koi missing transaction nahi.
- `backend/reports/monthly.php` — koi change nahi (pehle se sahi tha).

## Fix 2 — Har list/table par proper data table: 10 entries per page + search
**Problem:** Owner aur Sameer (staff) dono panels me tables/lists me saara data
ek saath load hota tha, page-wise view nahi tha.

**Fix (naye shared components, sab jagah same view):**
- `frontend/src/utils/usePagedList.js` (naya) — reusable hook:
  10 entries per page, Previous/Next pager, search change hote hi page 1 reset.
- `frontend/src/components/common/ListControls.jsx` (naya) — shared
  `ListSearchBar` (search box with clear ×) + `ListPager` (Showing X–Y of Z + pager).

Ye dono panels ke **saare** 7 list/table views par lagaya gaya hai:
1. Owner → All Entries (`pages/owner/AllEntries.jsx`) — pager + page-1 reset on filter change
2. Owner → Reports entries table (`pages/owner/MonthlyReport.jsx`) — pager
3. Owner → Dashboard "Today's Entries" (`pages/owner/OwnerDashboard.jsx`) — search box + pager
4. Owner → Pending Settlements (`pages/owner/PendingSettlements.jsx`) — pager
5. Sameer → My Entries (`pages/sameer/MyEntries.jsx`) — pager
6. Sameer → Dashboard "Today's Entries" (`pages/sameer/SameerDashboard.jsx`) — search box + pager
7. Sameer → Pending (`pages/sameer/SameerPending.jsx`) — pager

Dashboard/search-bar wale views me search ab shared `ListSearchBar` se chalta hai
(clear × button ke saath) aur wahi purana `filterEntries` logic use hota hai
(item, customer, source, amount, cost, profit sab par search).

## Fix 3 — Owner side se add ki gayi entry staff (Sameer) ko nahi dikh rahi thi
**Root cause:** Backend har jagah staff ke liye `created_by = sameer_id` filter
lagata tha — yaani sirf wahi entries jinhone SAMEER ne banayi thin. Owner ki
banayi entries staff ke list/dashboard me kabhi nahi aati thi.

**Fix (surgical, shared ledger):**
- `backend/entries/list.php` — staff ke liye `created_by` filter hata diya.
  Ab staff aur owner dono ko saari entries dikhti hain.
- `backend/entries/details.php` — staff kisi bhi entry ka detail (View) kholega;
  pehle owner ki entry par 403 aata tha.
- `backend/dashboard/sameer.php` — staff dashboard ki "Today's Entries" me bhi
  ab saari aaj ki entries dikhti hain (owner ki bhi).

Permissions waise hi hain: settle/unsettle/delete sirf owner hi kar sakta hai.

## Verification
- Frontend production build (`npm run build`) — PASS, koi error nahi.
- `git diff` audit kiya — sirf upar listed 11 modified + 2 nayi files change hui hain,
  project ka baaki koi file/data/config untouched hai.
- Frontend `dist/` fresh rebuild ki gayi hai (jo aapko deploy karna hota hai
  wahi updated build hai).

## Pending / Notes
- Koi pending code kaam nahi bacha — teeno reported fixes complete hain.
- Note: `frontend/node_modules` aur `frontend/dist` zip me shaamil hain
  (aapke original zip jaisa hi structure). Deploy karte waqt `frontend/dist`
  hi public folder hai.
