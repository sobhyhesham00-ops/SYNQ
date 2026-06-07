# Team Scheduling Portal (Synq Shift & Work Console)

A responsive, high-performance portal designed for full-stack staff scheduling management running on Express + React + Vite + Firebase.

---

## 🔒 Safe Development & Sandbox Setup

Local development defaults to sandbox emulation. Writes to live production keys are strictly blocked during local runs to avoid data corruption or leakage.

### 1. Key Prerequisite

Ensure that `.env` contains the required configuration. Copy the skeleton definitions from `.env.example`:

```bash
cp .env.example .env
```

To configure live credential fallbacks, populate the `VITE_FIREBASE_*` variables in `.env`. If unspecified, the application automatically reads properties safely from the default `firebase-applet-config.json` configuration.

---

## 🚀 Execution & Command Reference

### Development Modes

#### A. Launch with Local Firebase Emulators (Recommended for Testing)
Starts the local Firestore Emulator and Auth Emulator, auto-seeds role-based personas, and boosts local development on port `3000`:
```bash
npm run dev:emulator
```

#### B. Standard Cloud Run / Development Server
Starts the standard Express + Vite pipeline connected directly to the cloud project database:
```bash
npm run dev
```

---

### 🛡️ Testing & Verifications

The application includes robust static validation and mock testing frameworks.

#### A. Run General Unit & Integration Tests (Vitest)
Executes our comprehensive Firebase configuration validator and mock login engines checks:
```bash
npm run test
```

#### B. Run E2E Integration Suite Tests
```bash
npm run test:e2e
```

#### C. Run Linter (TypeScript Compiler checks)
```bash
npm run lint
```

#### D. Run Production Bundle Build
Compiles frontend static assets and bundles the custom Express server inside `dist/server.cjs` via `esbuild`:
```bash
npm run build
```

---

## 🎨 Environments & Role Personas

Our floating **Environment Badge** dynamically states of the current workspace (`LOCAL`, `STAGING`, or `PRODUCTION`) based on configured hostnames and variables:

*   **LOCAL**: Active when the hostname is `localhost` or `VITE_USE_EMULATOR` is `true`.
*   **STAGING**: Active on pre-release domain URLs (e.g., contains `-pre-`).
*   **PRODUCTION**: Active on primary production domains.

### 🔑 Deterministic Seed Logins inside LOCAL mode

When running in **LOCAL** mode with emulators, the database auto-seeds. You can find pre-configured logins inside the dropdown helper panel directly on the floating Environment Badge:

| Role Name | Username Format | Role Level | Sample Purpose | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `h.sobhy` | `tl` | Platform ownership / global configurations | `Password123` |
| **Director** | `a.hassan` | `tl` | Management level reporting & scheduling | `Password123` |
| **Team Leader** | `s.hassan` | `tl` | Staff assignments & timesheets approval | `Password123` |
| **QA Evaluator** | `b.rabea` | `qa` | Performance metrics & scorecard audit check | `Password123` |
| **Temporary Support** | `j.mohamed` | `agent` | Scheduled agent elevated to support level | `Password123` |
| **Standard Agent** | `a.sayed` | `agent` | Clock-in, break controls, and requests submission | `Password123` |
