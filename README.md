# SmartOps Unified Industrial & Logistics Platform
> **One Platform — 4 Connected Consoles:** 👑 Owner &middot; 🏭 Factory Supervisor &middot; 🚚 Logistics Driver &middot; 👷 Floor Worker

---

## 🌟 Executive Overview
**SmartOps** unites enterprise logistics management and shopfloor manufacturing execution into a single, cohesive, production-grade monorepo. It connects all 4 specialized operational dashboards with unified authentication, dynamic role switching, synchronized token management, real-time telemetry, and zero-configuration database fallbacks.

---

## 🖥️ The 4 Connected Dashboards

| Role | Console Route | Primary Capabilities | Demo Login |
| :--- | :--- | :--- | :--- |
| **👑 Enterprise Owner** | [`/owner`](http://localhost:5173/owner) | Executive KPIs, fleet telemetry & GPS dispatch, live trip routing, POD approval, inventory overview, payroll management. | `owner@smartops.com` / `password123` |
| **🏭 Floor Supervisor** | [`/supervisor`](http://localhost:5173/supervisor) | Shopfloor inventory & stock replenishment, task allocation & monitoring, worker registration approvals, QR scanning, attendance heatmaps, real-time alerts. | `supervisor@smartops.com` / `password123` |
| **🚚 Logistics Driver** | [`/driver`](http://localhost:5173/driver) | Duty check-in/out with GPS geofencing, active navigation & trip tracker, camera POD upload, digital signature capture. | `driver@smartops.com` / `password123` |
| **👷 Assembly Worker** | [`/worker`](http://localhost:5173/worker) | Task checklist & real-time progress updates, completion notes & photo proof, shift punch-in, leave requests, monthly salary slip downloads. | `worker@smartops.com` / `password123` |

---

## ⚡ Quick Start

### 1. Start Both Backend & Frontend (One Command)
From the root repository directory (`D:\SmartOps`):
```bash
npm run dev
```
This executes:
- **Unified Express Backend**: `http://localhost:5000` (API & Socket.io)
- **Vite React Frontend**: `http://localhost:5173` (with `/api` & `/socket.io` reverse proxy)

### 2. Zero-Configuration Database
When you start the backend, it will automatically connect using the first available option:
1. **Cloud / Configured MongoDB** via `MONGO_URI`
2. **Local MongoDB** at `mongodb://localhost:27017/smartops`
3. **In-Memory MongoMemoryServer** (Pre-cached binary v8.2.6 included — **requires zero external database installations!**)

Upon first boot, default accounts for all 4 roles are automatically seeded if not already present.

---

## 🔄 Cross-Dashboard Navigation & Role Switcher
While signed in, users have access to the **Universal Role Switcher** located in the top navigation bar. 
- Click on the role pill (`👑 Owner`, `🏭 Supervisor`, `🚚 Driver`, or `👷 Worker`) in the navbar to seamlessly switch views without having to re-authenticate.
- The sidebar dynamically updates navigation links according to the currently active dashboard.

---

## 📁 Monorepo Structure

```
SmartOps/
├── backend/                  # Unified Express.js & TypeScript Backend (Port 5000)
│   ├── src/
│   │   ├── config/           # Database connection & auto-seeding logic
│   │   ├── controllers/      # Enterprise Auth, Fleet, Trip, POD controllers
│   │   ├── factory/          # Supervisor & Worker controllers, routes, models
│   │   ├── middleware/       # JWT authentication & rate limiters
│   │   ├── models/           # Unified User, Trip, Fleet, POD, Factory schemas
│   │   ├── routes/           # Unified API routing table
│   │   ├── sockets/          # Central Socket.io telemetry & escalations
│   │   ├── app.ts            # Consolidated Express application
│   │   └── server.ts         # HTTP & WebSocket bootstrap
│   └── package.json
│
├── frontend/                 # Unified Vite + React + TypeScript Frontend (Port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # RoleSwitcher, Modals, Buttons, Badges
│   │   │   └── layout/       # Adaptive Sidebar & Navbar with role switcher
│   │   ├── layouts/          # SupervisorLayout & WorkerLayout with contexts
│   │   ├── pages/
│   │   │   ├── auth/         # Login (4 role tabs) & Register
│   │   │   ├── owner/        # Owner Dashboard, Fleet, Trips, POD, Inventory
│   │   │   ├── supervisor/   # Supervisor Dashboard, Tasks, Attendance, Reports
│   │   │   ├── driver/       # Driver Map, Active Trip, Duty Check-in
│   │   │   └── worker/       # Worker Tasks, Progress, Attendance, Salary
│   │   ├── services/         # Unified Axios & fetch API client
│   │   ├── store/            # Unified OperationsContext (Auth & Sync)
│   │   ├── types/            # TypeScript definitions (UserRole, etc.)
│   │   ├── App.tsx           # Unified React Router routes
│   │   └── main.tsx
│   └── vite.config.ts        # Vite dev server with proxy to backend
│
├── scripts/                  # Integration & verification test scripts
├── .gitignore                # Root git ignore rules
├── package-lock.json         # Unified dependency lockfile
└── package.json              # Monorepo workspaces & root concurrently script
```

---

## 🧪 Testing & Verification
You can run automated integration testing for all 4 roles at any time:
```bash
node scripts/test-backend.js
```
This tests:
- MongoDB in-memory daemon launch and connection
- Company and 4 demo user seed verification
- HTTP health check at `/health`
- Login authentication across Owner, Supervisor, Driver, and Worker

