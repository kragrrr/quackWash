# QuackWash 🦆

A mobile-first React app for tracking laundry machines at UOW International House, featuring live status updates, browser push notifications, and a gamified breadcrumb economy.

## Quick Start

```sh
npm install
npm run dev        # http://localhost:8080
```

## Architecture

### Data Flow

```
Tangerpay API ──► Vite Proxy (/api/tangerpay) ──► useMachines() hook ──► Index.tsx ──► UI Components
                                                  (TanStack Query,       │
                                                   60s polling,          ├─ StatusStrip  (machine counts)
                                                   stale-while-          ├─ DuckCard     (duck visuals + timer)
                                                   revalidate)           ├─ DuckDrawer   (details + watch/claim)
                                                                         └─ TopBar       (breadcrumbs + bell)
```

### API → UI State Mapping

| API Field | Condition | UI State | Duck Visual |
|-----------|-----------|----------|-------------|
| `status: "Maintenance"` | — | `"Maintenance"` | 💀 Grey wobbling duck, caution tape |
| `cycleInfo.cycleStatus: "Running"` | `status ≠ "Maintenance"` | `"Running"` | 🌀 Spinning duck, countdown badge |
| `cycleInfo.cycleStatus: "Idle"` | `status ≠ "Maintenance"` | `"Idle"` | 🦆 Green bobbing duck |

### Notification System (Service Worker)

**Files:** `public/sw.js`, `src/hooks/useNotifications.ts`

1. **"Watch this Duck"** — User taps a running machine → subscribes to alerts. When `cycleStatus` transitions from `Running → Idle`, the service worker fires: *"QUACK! Your laundry is done."*

2. **"Empty Pond"** — Toggle in the dashboard. When enabled, fires an alert the moment *any* machine flips to `Idle`: *"A duck just became free!"*

- Service worker is registered on first watch action
- `Notification.requestPermission()` is called before the first alert
- Watch state persists in `localStorage` so watches survive page refreshes

### Breadcrumb Economy

**Files:** `src/contexts/BreadcrumbContext.tsx`, `src/components/BreadcrumbEconomy.tsx`

- **Earning:** If a user clears their watched machine within 5 minutes of its cycle completing, they earn **+10 Breadcrumbs**.
- **Spending:** Breadcrumbs unlock cosmetic duck skins in the Duck Shop (Pirate Duck 🏴‍☠️, Propeller Hat 🧢, Cool Duck 😎, Royal Duck 👑).
- **Equipping:** Unlocked cosmetics can be equipped/unequipped. The active cosmetic renders as a badge overlay on all duck cards.
- **Persistence:** All state (`breadcrumbs`, `unlockedCosmetics`, `activeCosmeticId`, `completionTimestamps`) is persisted to `localStorage`.

### State Management Summary

| Concern | Mechanism | Persistence |
|---------|-----------|-------------|
| Machine data | TanStack Query (`useMachines`) | In-memory + stale cache |
| Watched machines | `useNotifications` hook | `localStorage` |
| Empty Pond toggle | `useNotifications` hook | `localStorage` |
| Breadcrumbs + cosmetics | React Context (`BreadcrumbContext`) | `localStorage` |

### Error Handling

- API failure → "🥶 Pond is frozen!" sonner toast, stale data remains on screen
- Notification permission denied → watch action silently degrades (no crash)

## Tech Stack

- **Vite** — Build tool & dev server (with proxy for CORS)
- **React 18** + **TypeScript**
- **TanStack Query v5** — Data fetching & caching
- **shadcn/ui** + **Tailwind CSS** — UI components
- **Web Push API** + **Service Worker** — Browser notifications
- **React Context + localStorage** — Breadcrumb economy state

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run test` | Run vitest suite |
| `npm run preview` | Preview production build |

## `/dev` Dinner Menu Admin

This project includes a password-gated `/dev` route for catering menu management.

- `/dev` requires a **viewer password** before loading the page
- The "Catering Admin" editor in that page requires a separate **admin password**
- Admin can upload dinner menu as:
  - text
  - image
  - PDF

### Required Environment Variables

Set these on your deployment environment:

- `DEV_VIEWER_PASSWORD`
- `DEV_ADMIN_PASSWORD`

If not set, local defaults are used in `app.js` (`replacejumpr` / `replacejumpr`). You should still set explicit environment variables in production.

### Set Passwords On Server

For Node process startup, export variables before launching:

```sh
export DEV_VIEWER_PASSWORD="replacejumpr"
export DEV_ADMIN_PASSWORD="replacejumpr"
node app.js
```

For PM2:

```sh
DEV_VIEWER_PASSWORD="replacejumpr" DEV_ADMIN_PASSWORD="replacejumpr" pm2 restart quackwash --update-env
```

### Data Persistence

- Dinner metadata is stored in `dinner-menu.json` at the project root.
- Uploaded menu files are stored in `/uploads` and served via `/uploads/<filename>`.

### Daily Catering Workflow

1. Open `/dev`
2. Enter viewer password
3. Open "What's for Dinner?" > "Catering Admin"
4. Enter admin password
5. Choose mode (text/image/PDF), upload or paste content, and save
