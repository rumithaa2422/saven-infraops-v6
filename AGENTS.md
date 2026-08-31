# Saven InfraOps — Repository Notes

## Frontend density (Phase 1 done, 2026-08-25)
- `frontend/src/styles.css` (~21,800 lines) is a monolith with many duplicated selector definitions (e.g. `.btn` ×3, `.page-header` ×2+, `.stat-value` ×4, `.modal` ×2, `.form-group` ×7). When editing, grep for ALL definitions — later rules win the cascade.
- Phase 1 compacted: `.workspace` (double-padding fixed via `.workspace .workspace { padding: 0 }`), `.page-header` (10px 16px), `.btn` family (6px 12px / 13px / 8px radius), `th,td` (6px 12px), `.stat-card` family, `.form-control` (6px 10px / 13px), `.modal` (padding 16, radius 12), topbar (52px), nav items (7px 10px), `--radius-lg/xl` capped at 12px.
- Components compacted: `components/common/SummaryCards.tsx`, `components/common/DashboardKPICard.tsx`, `layout/AppShell.tsx` (paddingTop 52), `layout/Sidebar.tsx` (icon size 17).
- Remaining (Phase 2/3): dashboard widget CSS sections in styles.css (~lines 2800-4000, KPI cards / widgets / charts use 18-20px radii, 24-28px fonts), per-module kits (`components/incidents/*`, `components/tickets/*`, `components/projects/*`) with Tailwind classes.

## Running the app
- Backend: `cd backend && npm run dev` (needs MySQL at localhost:3306, see `backend/.env.example`; seed admin via `npm run seed:admin`, creds admin@saven.local/admin123).
- Frontend: `cd frontend && npx vite --host 0.0.0.0 --port 12000` (exposed via work-1 URL). Auth token stored in localStorage keys `infraops.token` / `infraops.user`.
- No test suite in either package. Validate with `npx tsc -b && npm run build` in frontend.
- Docker is unavailable in this environment, so MySQL must be provisioned externally.
