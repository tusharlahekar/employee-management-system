# EMS API Documentation

Base URL (local dev): `http://localhost:5000/api`

Authentication uses a JWT, returned on login and accepted either as:
- an `httpOnly` cookie named `token` (set automatically by the login response), or
- an `Authorization: Bearer <token>` header (used by the frontend, since it also needs the
  token for cross-origin scenarios).

All responses follow the shape:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Errors:
```json
{ "success": false, "message": "...", "errors": ["..."] }
```

Roles: `super_admin`, `hr_manager`, `employee`.

---

## Auth

### POST /api/auth/login
Public.

**Body**
```json
{ "email": "admin@ems.com", "password": "Admin@12345" }
```
**200 Response**
```json
{
  "success": true,
  "message": "Login successful",
  "data": { "token": "<jwt>", "employee": { "...": "employee object, no password" } }
}
```
**401** invalid credentials · **403** account inactive

### POST /api/auth/logout
Auth required. Clears the auth cookie.

### GET /api/auth/me
Auth required. Returns the current authenticated employee.

---

## Employees

All routes below require authentication (`Authorization: Bearer <token>` or the `token` cookie).

### GET /api/employees
**Roles:** `super_admin`, `hr_manager`

Query params (all optional):
| Param      | Type   | Notes                                                      |
|------------|--------|--------------------------------------------------------------|
| page       | number | default 1                                                    |
| limit      | number | default 10, max 100                                          |
| search     | string | matches name or email (case-insensitive)                     |
| department | string | exact match                                                    |
| role       | string | `super_admin` \| `hr_manager` \| `employee`                    |
| status     | string | `active` \| `inactive`                                        |
| sortBy     | string | `name` \| `joiningDate` \| `createdAt` \| `salary` \| `department` |
| order      | string | `asc` \| `desc` (default `desc`)                                |

**200 Response**
```json
{
  "success": true,
  "data": [ { "...": "employee" } ],
  "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### GET /api/employees/:id
**Roles:** any authenticated user, but an `employee` may only fetch their **own** id (403 otherwise).

### POST /api/employees
**Roles:** `super_admin`, `hr_manager`
HR Managers get a `403` if they try to set `role: "super_admin"`.

**Body**
```json
{
  "name": "Aditi Sharma",
  "email": "aditi.sharma@ems.com",
  "phone": "+919876543210",
  "password": "Welcome@123",
  "department": "Engineering",
  "designation": "Software Engineer",
  "salary": 55000,
  "joiningDate": "2024-02-15",
  "status": "active",
  "role": "employee",
  "reportingManager": "<employee _id, or omit/null>"
}
```
**201** → created employee (`employeeId` auto-generated as `EMP0001`, etc.)

### PUT /api/employees/:id
**Roles:** all authenticated users, with different field scopes:
- `super_admin`: may update any field on any employee.
- `hr_manager`: may update any field except assigning/editing a Super Admin's `role`.
- `employee`: may only update **their own** record, and only `phone`, `password`, `profileImage` —
  any other field in the body is silently ignored, not rejected.

Also validates:
- `reportingManager` cannot equal the employee's own id.
- Reassigning `reportingManager` is rejected with `400` if it would create a circular chain
  (e.g. A → B → A).

### DELETE /api/employees/:id
**Roles:** `super_admin` only. Soft delete — sets `isDeleted: true`, `status: "inactive"`, and
detaches any direct reports (`reportingManager` set to `null`) so the org tree stays valid.
An admin cannot delete their own account (`400`).

### GET /api/employees/:id/reportees
**Roles:** any authenticated user. Returns employees whose `reportingManager` is `:id`.

### PATCH /api/employees/:id/manager
**Roles:** `super_admin`, `hr_manager`

**Body**
```json
{ "reportingManager": "<employee _id or null>" }
```
Same self-reference and circular-chain checks as `PUT`.

### POST /api/employees/import
**Roles:** `super_admin`, `hr_manager`. `multipart/form-data`, field name `file`, a `.csv` with header
row: `name,email,phone,password,department,designation,salary,joiningDate,status,role`
(`password`, `status`, `role` are optional — default to `Welcome@123`, `active`, `employee`).
HR Managers importing a row with `role=super_admin` get that row rejected, not the whole file.

**200 Response**
```json
{ "success": true, "data": { "created": 3, "failed": [ { "row": 4, "error": "..." } ] } }
```

---

## Organization

### GET /api/organization/tree
**Roles:** any authenticated user. Returns a nested array of employees rooted at anyone with no
`reportingManager`, each node containing a `children` array.

---

## Dashboard

### GET /api/dashboard/stats
**Roles:** `super_admin`, `hr_manager`

```json
{
  "success": true,
  "data": {
    "totalEmployees": 42,
    "activeEmployees": 38,
    "inactiveEmployees": 4,
    "departmentCount": 5,
    "byDepartment": [ { "department": "Engineering", "count": 20 } ],
    "byRole": [ { "role": "employee", "count": 35 } ]
  }
}
```

---

## HTTP Status Codes Used

| Code | Meaning                                              |
|------|-------------------------------------------------------|
| 200  | Success                                                |
| 201  | Resource created                                        |
| 400  | Validation error / bad request (e.g. circular report)    |
| 401  | Not authenticated / invalid credentials / expired token    |
| 403  | Authenticated but not permitted (RBAC)                      |
| 404  | Resource not found                                            |
| 409  | Duplicate key (e.g. email already exists)                        |
| 500  | Unexpected server error                                             |
