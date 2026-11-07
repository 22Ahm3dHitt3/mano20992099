# Graduation Management System

A local-first graduation management dashboard with Arabic RTL UI, dark premium styling, and offline data persistence for session records, financial records, employee records, deductions, and backup/restore flows.

## Features

- Secure login with fixed credentials:
  - Username: `MANO2099`
  - Password: `MARK2099`
- Dashboard with live counters and recent activity
- Graduation sessions table with add/edit/delete, search, sorting, CSV export, print, and pagination
- Financial records table with automatic calculations and payment status
- Employees management with ratings and deduction linkage
- Deductions management
- Backup export and restore import with merge/replace options
- Settings panel with theme and app metadata
- Arabic RTL interface and dark premium desktop style

## Run locally

```bash
cd /Users/veen/Documents/manoproj
npm install
npm run dev -- --host 0.0.0.0
```

Then open the local Vite URL shown in the terminal.

## Production build

```bash
npm run build
```

## Notes

- Data persists locally in the browser using local storage while the app is running.
- The application is designed as a desktop-style offline management interface and is ready for extension into an Electron + SQLite packaging workflow if needed.
