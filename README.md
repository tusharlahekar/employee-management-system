# Employee Management System (EMS)

A full-stack Employee Management System with secure authentication, role-based
access control, employee CRUD, organizational hierarchy, search/filter/sort,
a stats dashboard with charts, CSV import, soft delete, dark mode, and Docker
support — built for the Full Stack Developer hiring assignment.

## Tech Stack

| Layer          | Technology                                              |
|----------------|----------------------------------------------------------|
| Frontend       | React 19 + TypeScript + Vite, Tailwind CSS v4, React Router, Axios, Recharts, lucide-react |
| Backend        | Node.js + Express.js                                     |
| Database       | MongoDB + Mongoose                                        |
| Authentication | JWT (httpOnly cookie + Bearer header) + bcrypt password hashing |
| Testing        | Jest + Supertest + mongodb-memory-server                  |
| Deployment     | Docker + docker-compose (Mongo, backend, Nginx-served frontend) |

## Project Structure

```
ems/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── models/          # Mongoose schema (Employee doubles as the auth user)
│   │   ├── middleware/      # auth, RBAC, validation, error handling
│   │   ├── controllers/     # route handlers
│   │   ├── routes/          # Express routers
│   │   ├── seed/            # creates the first Super Admin
│   │   ├── app.js           # Express app (exported for tests)
│   │   └── server.js        # entry point
│   ├── tests/                # Jest + Supertest test suites
│   └── Dockerfile
├── frontend/                 # React + TypeScript SPA
│   ├── src/
│   │   ├── pages/            # Login, Dashboard, Employees, EmployeeDetail, Organization, Profile
│   │   ├── components/       # Sidebar, Navbar, EmployeeForm, CSVImport, ProtectedRoute, ui.tsx
│   │   ├── context/          # AuthContext, ThemeContext (dark mode)
│   │   └── api/               # Axios instance
│   └── Dockerfile
├── docker-compose.yml         # Mongo + backend + frontend
├── sample-employees.csv       # sample file for the CSV import feature
└── API_DOCS.md                # full API reference
```

## Features Implemented

**Authentication**
- Login / Logout, JWT issued as both an httpOnly cookie and a bearer token
- Passwords hashed with bcrypt, never returned by the API
- Protected routes on both backend (middleware) and frontend (`ProtectedRoute`)

**Role-Based Access Control** (Super Admin / HR Manager / Employee)
- Super Admin: full CRUD, can assign any role/manager, can soft-delete
- HR Manager: create/edit/view employees, **cannot** delete, **cannot** assign the Super Admin role
- Employee: can only view/edit their own profile, and only a limited field set (phone, password)
- Enforced server-side in `rbac.middleware.js` and controller-level checks — the frontend UI reflects
  the same rules but the backend is the source of truth

**Employee Management**
- Full CRUD with all required fields (Employee ID auto-generated as `EMP0001`, `EMP0002`, …)
- Soft delete (`isDeleted` flag) — deleted employees are excluded from all queries by default and
  their direct reports are automatically detached

**Organizational Hierarchy**
- Assign/re-assign a reporting manager (`PATCH /api/employees/:id/manager`)
- Circular-reporting prevention: the API walks the proposed manager's chain up to the root and
  rejects the change if it would ever loop back to the employee being edited
- `GET /api/organization/tree` returns a nested tree; the frontend renders it as a collapsible tree
- `GET /api/employees/:id/reportees` lists direct reports (shown on the employee detail page)

**Dashboard**
- Total / Active / Inactive employee counts, department count
- Bonus: bar chart (employees by department) and pie chart (employees by role) via Recharts

**Search, Filter, Sort, Pagination**
- Debounced search by name/email, filters by department/role/status, sort by name/joining date/salary,
  server-side pagination (`GET /api/employees`)

**Validation**
- Backend: `express-validator` on all write endpoints (email format, phone format, salary ≥ 0,
  required fields, valid enums) plus Mongoose schema-level validation as a second line of defense
- Frontend: HTML5 required/min/pattern validation on all forms, with server error messages surfaced
  via toast notifications

**Bonus Features**
- ✅ Pagination
- ✅ Soft delete
- ✅ CSV import (`POST /api/employees/import`, multipart upload — see `sample-employees.csv`)
- ✅ Dashboard charts (bar + pie, Recharts)
- ✅ Dark mode (class-based, persisted to `localStorage`, system-preference aware on first load)
- ✅ Docker (`docker-compose.yml` — Mongo + backend + Nginx-served frontend)
- ✅ Unit tests (Jest + Supertest, covering auth and employee/RBAC/circular-reporting logic)
- ⬜ Live deployment — not deployed as part of this submission; see "Deploying" below for how to.

## Getting Started (Local, without Docker)

### Prerequisites
- Node.js 18+
- A running MongoDB instance (local or Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed               # creates the first Super Admin (see .env for credentials)
npm run dev                 # starts on http://localhost:5000
```

Default seeded Super Admin (override via `.env` before seeding):
- **Email:** `admin@ems.com`
- **Password:** `Admin@12345`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :5000
```

Open `http://localhost:5173` and log in with the seeded Super Admin. Once logged in as Super Admin
or HR Manager you can create HR Manager / Employee accounts through the UI (or via CSV import using
`sample-employees.csv`, default password `Welcome@123` for imported rows without one).

### 3. Running Tests

```bash
cd backend
npm test
```

Tests spin up an in-memory MongoDB instance automatically (via `mongodb-memory-server`) — no manual
DB setup needed, but the **first run needs outbound internet access** to download the MongoDB binary.

## Getting Started (Docker)

```bash
cp backend/.env.example .env   # optional: override JWT_SECRET / seed admin credentials at the root
docker compose up --build
docker compose exec backend npm run seed   # create the first Super Admin
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## API Documentation

See [API_DOCS.md](./API_DOCS.md) for the full endpoint reference, request/response shapes, and
role permissions per endpoint.

## Design Notes & Known Trade-offs

- Employees and "users" are the same collection/model — every employee record has login
  credentials and a role, which matches the assignment's RBAC model directly instead of
  maintaining two synced collections.
- `reportingManager` selection in the "Add/Edit Employee" form is currently populated from the
  employees visible on the current results page rather than a separate unpaginated endpoint; for a
  very large organization this should be swapped for a searchable async-select against a dedicated
  lightweight `/api/employees?limit=1000&fields=name,employeeId` call.
- Profile photo upload is modeled as a `profileImage` URL field; wiring up actual file upload
  (e.g. to S3/Cloudinary) was left out to keep the assignment's scope focused on the core EMS
  requirements, but `multer` is already included in the backend for this purpose.
- Live deployment was left undone since it depends on credentials/hosting you may already have a
  preference for (Render/Railway/Vercel/EC2, MongoDB Atlas, etc.) — the Docker setup above gets you
  to a deployable image in one command.

## Evaluation Criteria Self-Check

| Criteria                  | Where to look                                                    |
|----------------------------|-------------------------------------------------------------------|
| Frontend UI & UX           | `frontend/src/pages`, `frontend/src/components`                   |
| Backend APIs                | `backend/src/routes`, `backend/src/controllers`                    |
| RBAC                        | `backend/src/middleware/rbac.middleware.js` + role checks in `employee.controller.js` |
| Organizational Hierarchy    | `organization.controller.js`, `isCircularReport()` in `employee.controller.js` |
| CRUD                        | `employee.controller.js`                                          |
| Database                    | `backend/src/models/Employee.js`                                   |
| Validation                  | `backend/src/middleware/validate.js`                               |
| Code Quality & Docs         | This README, `API_DOCS.md`, inline comments, `backend/tests`       |
