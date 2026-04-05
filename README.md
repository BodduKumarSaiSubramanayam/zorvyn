# Finance Data Processing and Access Control Backend

> **Zorvyn FinTech — Backend Developer Intern Assignment**  
> A robust, production-grade REST API for managing financial records with Role-Based Access Control (RBAC), dashboard analytics, and comprehensive data validation.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Role-Based Access Control](#role-based-access-control)
- [Features](#features)
- [Testing](#testing)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Project Structure](#project-structure)

---

## Overview

This backend serves as the core API for a **finance dashboard system** where different users interact with financial records based on their roles. The system supports:

- **User & Role Management** — Create, read, update, and delete users with role-based permissions
- **Financial Records CRUD** — Full lifecycle management of income/expense transactions
- **Dashboard Analytics** — Aggregated summaries, category breakdowns, monthly/weekly trends
- **Access Control** — Middleware-enforced RBAC with three distinct role tiers
- **Data Validation** — Comprehensive input validation with detailed error messages
- **Security** — JWT authentication, password hashing, rate limiting, security headers

---

## Architecture

The application follows a **layered architecture** with clear separation of concerns:

```
Request → Middleware (Auth + Rate Limit) → Controller → Service → Prisma ORM → SQLite
```

| Layer          | Responsibility                                                |
|----------------|---------------------------------------------------------------|
| **Middleware**  | Authentication, authorization, rate limiting, error handling  |
| **Controllers** | HTTP request/response handling, input validation delegation   |
| **Services**    | Core business logic, data processing, access control rules   |
| **Schemas**     | Zod-based input validation and type inference                 |
| **Models**      | Prisma schema defining data models and relationships         |

---

## Tech Stack

| Technology       | Purpose                                          |
|------------------|--------------------------------------------------|
| **Node.js**      | JavaScript runtime                               |
| **Express.js**   | Web framework for REST APIs                      |
| **TypeScript**   | Type safety and developer experience             |
| **Prisma ORM**   | Database ORM with migrations and type generation |
| **SQLite**       | Lightweight, file-based database                 |
| **JWT**          | Token-based stateless authentication             |
| **Zod**          | Runtime schema validation with TypeScript inference |
| **bcryptjs**     | Password hashing (12 salt rounds)                |
| **Helmet**       | Security HTTP headers                            |
| **express-rate-limit** | API and auth endpoint rate limiting        |
| **Jest + Supertest** | Integration testing framework              |
| **Morgan**       | HTTP request logging                             |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd zorvyn

# 2. Install dependencies
npm install

# 3. Set up the environment
# A .env file is included with development defaults.
# For production, update the values accordingly.

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. Seed the database with sample data
npm run seed

# 7. Start the development server
npm run dev
```

The server will start at **http://localhost:3000**.

### Available Scripts

| Script              | Description                                |
|---------------------|--------------------------------------------|
| `npm run dev`       | Start development server with hot-reload   |
| `npm run build`     | Compile TypeScript to JavaScript           |
| `npm start`         | Run compiled production build              |
| `npm run seed`      | Seed database with sample users & records  |
| `npm test`          | Run integration test suite                 |
| `npm run test:coverage` | Run tests with coverage report        |
| `npm run prisma:generate` | Regenerate Prisma Client            |
| `npm run prisma:migrate`  | Run pending migrations              |
| `npm run prisma:reset`    | Reset database and re-run migrations |

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Response Format

All endpoints return a consistent JSON structure:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "pagination": { ... }  // Present only for list endpoints
}
```

Error responses include descriptive error messages:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

---

### 🔐 Authentication

#### Register a New User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "mypassword123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "VIEWER" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@zorvyn.com",
  "password": "admin123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": { "id": "...", "name": "Admin User", "email": "admin@zorvyn.com", "role": "ADMIN" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

### 👤 User Management (Admin Only)

All user management endpoints require the `ADMIN` role.

#### List All Users

```http
GET /api/users
Authorization: Bearer <admin-token>
```

#### Get User by ID

```http
GET /api/users/:id
Authorization: Bearer <admin-token>
```

#### Update User (Role/Status)

```http
PATCH /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "ANALYST",
  "status": "ACTIVE"
}
```

**Valid roles:** `VIEWER`, `ANALYST`, `ADMIN`  
**Valid statuses:** `ACTIVE`, `INACTIVE`

#### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer <admin-token>
```

> **Safety:** Admins cannot demote, deactivate, or delete their own account.

---

### 💰 Financial Records (Role-Based)

#### Create Record (Admin Only)

```http
POST /api/records
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 5000.00,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-04-01T00:00:00Z",
  "description": "Monthly salary credit",
  "notes": "April 2024 salary"
}
```

**Valid types:** `INCOME`, `EXPENSE`

#### List Records (Analyst, Admin) — With Filtering & Pagination

```http
GET /api/records?type=INCOME&category=Salary&startDate=2024-01-01&endDate=2024-12-31&search=monthly&page=1&limit=10&sortBy=date&sortOrder=desc
Authorization: Bearer <analyst-or-admin-token>
```

**Query Parameters:**

| Parameter   | Type    | Default  | Description                          |
|-------------|---------|----------|--------------------------------------|
| `type`      | string  | —        | Filter by INCOME or EXPENSE          |
| `category`  | string  | —        | Filter by category (partial match)   |
| `startDate` | string  | —        | Filter records from this date        |
| `endDate`   | string  | —        | Filter records up to this date       |
| `search`    | string  | —        | Search in category, description, notes |
| `page`      | number  | 1        | Page number                          |
| `limit`     | number  | 10       | Records per page (max 100)           |
| `sortBy`    | string  | date     | Sort field: date, amount, category, type, createdAt |
| `sortOrder` | string  | desc     | Sort direction: asc or desc          |

**Response includes pagination metadata:**
```json
{
  "pagination": {
    "total": 32,
    "page": 1,
    "limit": 10,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Single Record (Analyst, Admin)

```http
GET /api/records/:id
Authorization: Bearer <analyst-or-admin-token>
```

#### Update Record (Admin Only)

```http
PUT /api/records/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 5500,
  "category": "Updated Category"
}
```

#### Delete Record (Admin Only)

```http
DELETE /api/records/:id?soft=true
Authorization: Bearer <admin-token>
```

- `soft=true` (default): Soft-deletes the record (sets `isDeleted` flag)
- `soft=false`: Permanently removes the record from the database

#### Restore Soft-Deleted Record (Admin Only)

```http
PATCH /api/records/:id/restore
Authorization: Bearer <admin-token>
```

---

### 📊 Dashboard & Analytics (All Authenticated Users)

#### Financial Summary

```http
GET /api/dashboard/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": {
    "totalIncome": 58200,
    "totalExpenses": 22650,
    "netBalance": 35550,
    "totalRecords": 31,
    "categoryBreakdown": {
      "Salary": { "income": 51000, "expense": 0, "net": 51000 },
      "Rent": { "income": 0, "expense": 10800, "net": -10800 }
    },
    "topExpenseCategories": [
      { "category": "Rent", "amount": 10800 }
    ],
    "topIncomeSources": [
      { "category": "Salary", "amount": 51000 }
    ],
    "savingsRate": 61.08
  }
}
```

#### Recent Activity

```http
GET /api/dashboard/recent?limit=10
Authorization: Bearer <token>
```

#### Monthly Trends

```http
GET /api/dashboard/trends/monthly?months=12
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "period": "2024-01",
      "month": "Jan 2024",
      "income": 8500,
      "expenses": 2100,
      "net": 6400,
      "count": 5
    }
  ]
}
```

#### Weekly Trends

```http
GET /api/dashboard/trends/weekly?weeks=8
Authorization: Bearer <token>
```

#### Full Dashboard (Combined)

```http
GET /api/dashboard
Authorization: Bearer <token>
```

Returns all of the above in a single response: `summary`, `recentActivity`, `monthlyTrends`, `weeklyTrends`.

---

### 🏥 Health & Info

```http
GET /         → API info and available endpoints
GET /health   → Health check with uptime
```

---

## Role-Based Access Control

The system enforces three distinct user roles with hierarchical permissions:

| Endpoint                    | Viewer | Analyst | Admin |
|-----------------------------|:------:|:-------:|:-----:|
| Register / Login            |   ✅   |   ✅    |  ✅   |
| View Profile                |   ✅   |   ✅    |  ✅   |
| Dashboard Summary           |   ✅   |   ✅    |  ✅   |
| Dashboard Trends            |   ✅   |   ✅    |  ✅   |
| Recent Activity             |   ✅   |   ✅    |  ✅   |
| View Records (list/detail)  |   ❌   |   ✅    |  ✅   |
| Create Records              |   ❌   |   ❌    |  ✅   |
| Update Records              |   ❌   |   ❌    |  ✅   |
| Delete Records              |   ❌   |   ❌    |  ✅   |
| Restore Records             |   ❌   |   ❌    |  ✅   |
| List Users                  |   ❌   |   ❌    |  ✅   |
| Update User Role/Status     |   ❌   |   ❌    |  ✅   |
| Delete Users                |   ❌   |   ❌    |  ✅   |

**Implementation:** Access control is enforced at the middleware level using `authenticate` (JWT verification) and `authorize(roles[])` (role checking) middleware applied to route definitions.

---

## Features

### Core Features

- ✅ **User Registration & Login** with JWT tokens
- ✅ **Role Management** (Viewer, Analyst, Admin)
- ✅ **User Status Management** (Active/Inactive)
- ✅ **Financial Records CRUD** (Create, Read, Update, Delete)
- ✅ **Record Filtering** by type, category, date range
- ✅ **Dashboard Summary** with totals, net balance, category breakdown
- ✅ **Monthly & Weekly Trends** with income/expense breakdown
- ✅ **Role-Based Access Control** enforced at middleware level

### Optional Enhancements Implemented

- ✅ **JWT Token Authentication** with configurable expiry
- ✅ **Pagination** with page, limit, total pages, hasNext/hasPrev metadata
- ✅ **Search Support** across category, description, and notes fields
- ✅ **Soft Delete** with restore functionality
- ✅ **Rate Limiting** (general API + stricter auth endpoint limiter)
- ✅ **Integration Tests** — 46 tests covering auth, RBAC, CRUD, dashboard, errors
- ✅ **Comprehensive API Documentation** (this README)
- ✅ **Security Headers** via Helmet
- ✅ **Input Validation** with detailed Zod error messages
- ✅ **Configurable Sorting** by multiple fields (date, amount, category, etc.)

---

## Testing

The project includes **46 integration tests** covering all major features:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

### Test Coverage

| Category              | Tests | Description                                      |
|-----------------------|-------|--------------------------------------------------|
| Authentication        | 9     | Register, login, profile, validation, duplicates |
| Access Control (RBAC) | 9     | Role enforcement for all endpoint categories     |
| User Management       | 5     | CRUD operations, validation, safety checks       |
| Financial Records     | 14    | CRUD, filtering, search, soft/hard delete, restore |
| Dashboard & Analytics | 5     | Summary, trends, recent activity, full dashboard |
| Error Handling        | 4     | 404s, malformed JSON, health check               |

---

## Design Decisions & Assumptions

### Architecture

1. **Layered Architecture**: Controllers handle HTTP, Services handle business logic, Prisma handles data. This separation makes the code testable and maintainable.

2. **Service Pattern**: Business logic is extracted into service classes (AuthService, UserService, RecordService, DashboardService) rather than being embedded in controllers. This keeps controllers thin and focused on request/response handling.

3. **Custom Error Hierarchy**: AppError subclasses (BadRequestError, NotFoundError, ForbiddenError, etc.) map domain errors to HTTP status codes, allowing the global error handler to produce consistent responses.

### Database

4. **SQLite**: Chosen for simplicity and zero-configuration. No external database server required. For production, the schema is compatible with PostgreSQL or MySQL via Prisma's provider swap.

5. **Soft Delete**: Financial records use an `isDeleted` boolean flag instead of hard deletion by default. This preserves audit trails and allows recovery. Hard delete is available via `?soft=false`.

6. **UUIDs**: All primary keys use UUIDs for security (no sequential ID enumeration) and distributed system compatibility.

### Security

7. **Password Hashing**: bcryptjs with 12 salt rounds for production-grade security.

8. **JWT Tokens**: Stateless authentication with 24-hour expiry. Token contains user ID, email, and role.

9. **Admin Self-Protection**: Admins cannot demote, deactivate, or delete their own accounts to prevent accidental lockout.

10. **Rate Limiting**: General API limiter (100 req/15min) and stricter auth limiter (20 req/15min) to prevent brute-force attacks.

### Validation

11. **Zod Schemas**: Used instead of manual validation for type-safe, declarative validation with auto-generated TypeScript types. Validation errors include field-level detail.

12. **Partial Updates**: Record and user update endpoints accept partial payloads — only provided fields are updated. At least one field must be provided.

### Tradeoffs

13. **In-Memory Analytics**: Dashboard aggregations are computed on-the-fly rather than pre-computed. This is acceptable for small-to-medium datasets but would need caching or materialized views at scale.

14. **No Refresh Tokens**: For simplicity, only access tokens are used. A production system would implement refresh token rotation.

15. **SQLite Limitations**: SQLite doesn't support concurrent write operations well. For a multi-user production system, PostgreSQL or MySQL would be more appropriate.

---

## Project Structure

```
zorvyn/
├── prisma/
│   ├── schema.prisma          # Data model definitions
│   ├── migrations/            # Database migration history
│   └── dev.db                 # SQLite database file (auto-generated)
├── src/
│   ├── index.ts               # Application entry point & Express setup
│   ├── seed.ts                # Database seeding script
│   ├── controllers/           # HTTP request handlers (thin layer)
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── record.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/              # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── record.service.ts
│   │   └── dashboard.service.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # JWT authentication & role authorization
│   │   ├── errorHandler.ts    # Global error handler & 404 handler
│   │   └── rateLimiter.ts     # API & auth rate limiters
│   ├── schemas/               # Zod validation schemas
│   │   └── validation.ts
│   ├── lib/                   # Shared utilities
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── constants.ts       # Role, status, type definitions
│   │   ├── errors.ts          # Custom error class hierarchy
│   │   └── response.ts        # Standardized API response helpers
│   └── tests/                 # Integration tests
│       └── api.test.ts
├── .env                       # Environment variables
├── .gitignore
├── jest.config.js             # Jest test configuration
├── package.json
├── tsconfig.json
└── README.md                  # This file
```

---

## Sample Credentials

After running `npm run seed`, the following test accounts are available:

| Role       | Email                  | Password     | Access Level               |
|------------|------------------------|--------------|-----------------------------|
| **Admin**  | admin@zorvyn.com       | admin123     | Full access                 |
| **Analyst**| analyst@zorvyn.com     | analyst123   | View records + dashboard    |
| **Viewer** | viewer@zorvyn.com      | viewer123    | Dashboard only              |
| **Inactive**| inactive@zorvyn.com   | inactive123  | Login blocked (deactivated) |

---

## Quick Test with cURL

```bash
# 1. Login as Admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zorvyn.com","password":"admin123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")

# 2. Get Dashboard Summary
curl -s http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# 3. List Financial Records
curl -s "http://localhost:3000/api/records?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# 4. Create a New Record
curl -s -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1500,"type":"EXPENSE","category":"Travel","date":"2024-04-05","description":"Business trip"}' \
  | python -m json.tool

# 5. List Users
curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

---

## Environment Variables

| Variable               | Default                          | Description                  |
|------------------------|----------------------------------|------------------------------|
| `DATABASE_URL`         | `file:./dev.db`                  | SQLite database path         |
| `JWT_SECRET`           | `zorvyn_finance_secret_key_2024` | JWT signing secret           |
| `PORT`                 | `3000`                           | Server port                  |
| `NODE_ENV`             | `development`                    | Environment mode             |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min)               | Rate limit window            |
| `RATE_LIMIT_MAX_REQUESTS` | `100`                        | Max requests per window      |

---

> **Author:** Kumar Sai Subramanyam Boddu  
> **Email:** boddukumarsaisubramanyam@gmail.com  
> **Assignment:** Finance Data Processing and Access Control Backend — Zorvyn FinTech
