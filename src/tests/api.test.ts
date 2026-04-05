import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Integration tests for the Zorvyn Finance API.
 * Tests all major features: auth, RBAC, records CRUD, dashboard, validation.
 */

let adminToken: string;
let analystToken: string;
let viewerToken: string;
let testUserId: string;
let testRecordId: string;

// ── Setup & Teardown ──

beforeAll(async () => {
  // Clear and seed test data
  await prisma.financialRecord.deleteMany({});
  await prisma.user.deleteMany({});

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Test Admin', email: 'testadmin@test.com', password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' },
  });

  await prisma.user.create({
    data: { name: 'Test Analyst', email: 'testanalyst@test.com', password: hashedPassword, role: 'ANALYST', status: 'ACTIVE' },
  });

  await prisma.user.create({
    data: { name: 'Test Viewer', email: 'testviewer@test.com', password: hashedPassword, role: 'VIEWER', status: 'ACTIVE' },
  });

  // Login to get tokens
  const adminLogin = await request(app).post('/api/auth/login').send({ email: 'testadmin@test.com', password: 'password123' });
  adminToken = adminLogin.body.data.token;

  const analystLogin = await request(app).post('/api/auth/login').send({ email: 'testanalyst@test.com', password: 'password123' });
  analystToken = analystLogin.body.data.token;

  const viewerLogin = await request(app).post('/api/auth/login').send({ email: 'testviewer@test.com', password: 'password123' });
  viewerToken = viewerLogin.body.data.token;

  // Create a sample record for testing
  const record = await prisma.financialRecord.create({
    data: {
      amount: 5000,
      type: 'INCOME',
      category: 'Salary',
      date: new Date(),
      description: 'Test salary',
      userId: admin.id,
    },
  });
  testRecordId = record.id;
});

afterAll(async () => {
  await prisma.financialRecord.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════
// AUTHENTICATION TESTS
// ═══════════════════════════════════════════════

describe('Authentication', () => {
  test('POST /api/auth/register — should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'newuser@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newuser@test.com');
    expect(res.body.data.user.role).toBe('VIEWER');
    expect(res.body.data.token).toBeDefined();
    testUserId = res.body.data.user.id;
  });

  test('POST /api/auth/register — should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup User', email: 'newuser@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register — should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bad', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register — should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short', email: 'short@test.com', password: '12' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login — should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  test('POST /api/auth/login — should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testadmin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login — should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/profile — should return current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('testadmin@test.com');
    expect(res.body.data.role).toBe('ADMIN');
  });

  test('GET /api/auth/profile — should reject without token', async () => {
    const res = await request(app).get('/api/auth/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// ACCESS CONTROL TESTS
// ═══════════════════════════════════════════════

describe('Access Control (RBAC)', () => {
  test('Viewer should NOT access records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('Viewer should access dashboard summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Analyst should access records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Analyst should NOT create records', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 100, type: 'INCOME', category: 'Test', date: new Date().toISOString() });

    expect(res.status).toBe(403);
  });

  test('Analyst should NOT manage users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(403);
  });

  test('Viewer should NOT manage users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('Admin should access everything', async () => {
    const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(usersRes.status).toBe(200);

    const recordsRes = await request(app).get('/api/records').set('Authorization', `Bearer ${adminToken}`);
    expect(recordsRes.status).toBe(200);

    const dashRes = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${adminToken}`);
    expect(dashRes.status).toBe(200);
  });

  test('Should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
  });

  test('Should reject missing token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════
// USER MANAGEMENT TESTS
// ═══════════════════════════════════════════════

describe('User Management', () => {
  test('GET /api/users — should list all users (Admin)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('PATCH /api/users/:id — should update user role (Admin)', async () => {
    const res = await request(app)
      .patch(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ANALYST' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('ANALYST');
  });

  test('PATCH /api/users/:id — should update user status (Admin)', async () => {
    const res = await request(app)
      .patch(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('INACTIVE');
  });

  test('PATCH /api/users/:id — should reject empty update', async () => {
    const res = await request(app)
      .patch(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
  });

  test('PATCH /api/users/:id — should reject invalid role', async () => {
    const res = await request(app)
      .patch(`/api/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SUPERADMIN' });

    expect(res.status).toBe(422);
  });
});

// ═══════════════════════════════════════════════
// FINANCIAL RECORDS TESTS
// ═══════════════════════════════════════════════

describe('Financial Records', () => {
  let createdRecordId: string;

  test('POST /api/records — should create a record (Admin)', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 2500,
        type: 'EXPENSE',
        category: 'Marketing',
        date: new Date().toISOString(),
        description: 'Facebook ads campaign',
        notes: 'Q1 campaign',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(2500);
    expect(res.body.data.type).toBe('EXPENSE');
    createdRecordId = res.body.data.id;
  });

  test('POST /api/records — should reject negative amount', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: -100, type: 'INCOME', category: 'Test', date: new Date().toISOString() });

    expect(res.status).toBe(422);
  });

  test('POST /api/records — should reject invalid type', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100, type: 'TRANSFER', category: 'Test', date: new Date().toISOString() });

    expect(res.status).toBe(422);
  });

  test('POST /api/records — should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(422);
  });

  test('GET /api/records — should return paginated records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination.hasNext).toBeDefined();
    expect(res.body.pagination.hasPrev).toBeDefined();
  });

  test('GET /api/records — should filter by type', async () => {
    const res = await request(app)
      .get('/api/records?type=INCOME')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const records = res.body.data;
    records.forEach((r: any) => {
      expect(r.type).toBe('INCOME');
    });
  });

  test('GET /api/records — should filter by category', async () => {
    const res = await request(app)
      .get('/api/records?category=Marketing')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('GET /api/records — should support search', async () => {
    const res = await request(app)
      .get('/api/records?search=Facebook')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('GET /api/records/:id — should get a single record', async () => {
    const res = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdRecordId);
  });

  test('PUT /api/records/:id — should update a record', async () => {
    const res = await request(app)
      .put(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 3000, category: 'Advertising' });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(3000);
    expect(res.body.data.category).toBe('Advertising');
  });

  test('DELETE /api/records/:id — should soft-delete a record', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('soft-deleted');
  });

  test('PATCH /api/records/:id/restore — should restore a soft-deleted record', async () => {
    const res = await request(app)
      .patch(`/api/records/${createdRecordId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isDeleted).toBe(false);
  });

  test('DELETE /api/records/:id?soft=false — should hard-delete a record', async () => {
    const res = await request(app)
      .delete(`/api/records/${createdRecordId}?soft=false`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('permanently');
  });

  test('GET /api/records/:id — should return 404 for deleted record', async () => {
    const res = await request(app)
      .get(`/api/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════
// DASHBOARD TESTS
// ═══════════════════════════════════════════════

describe('Dashboard & Analytics', () => {
  test('GET /api/dashboard/summary — should return financial summary', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('totalExpenses');
    expect(res.body.data).toHaveProperty('netBalance');
    expect(res.body.data).toHaveProperty('totalRecords');
    expect(res.body.data).toHaveProperty('categoryBreakdown');
    expect(res.body.data).toHaveProperty('topExpenseCategories');
    expect(res.body.data).toHaveProperty('topIncomeSources');
    expect(res.body.data).toHaveProperty('savingsRate');
  });

  test('GET /api/dashboard/recent — should return recent activity', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/dashboard/trends/monthly — should return monthly trends', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends/monthly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/dashboard/trends/weekly — should return weekly trends', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends/weekly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/dashboard — should return full dashboard data', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('recentActivity');
    expect(res.body.data).toHaveProperty('monthlyTrends');
    expect(res.body.data).toHaveProperty('weeklyTrends');
  });
});

// ═══════════════════════════════════════════════
// ERROR HANDLING TESTS
// ═══════════════════════════════════════════════

describe('Error Handling', () => {
  test('Should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('Should handle malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "bad json');

    expect(res.status).toBe(400);
  });

  test('Health check should work', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('Root endpoint should return API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.endpoints).toBeDefined();
  });
});
