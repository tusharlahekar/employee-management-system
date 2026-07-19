process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Employee = require('../src/models/Employee');

let mongod;
let adminToken;
let hrToken;
let empToken;
let empId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  await Employee.create({
    name: 'Admin User',
    email: 'admin@test.com',
    phone: '+911234567890',
    password: 'Admin@12345',
    department: 'Administration',
    designation: 'Super Admin',
    salary: 0,
    joiningDate: new Date(),
    role: 'super_admin',
  });
  await Employee.create({
    name: 'HR User',
    email: 'hr@test.com',
    phone: '+911234567891',
    password: 'Hr@123456',
    department: 'HR',
    designation: 'HR Manager',
    salary: 50000,
    joiningDate: new Date(),
    role: 'hr_manager',
  });
  const emp = await Employee.create({
    name: 'Regular Employee',
    email: 'emp@test.com',
    phone: '+911234567892',
    password: 'Emp@123456',
    department: 'Engineering',
    designation: 'Developer',
    salary: 40000,
    joiningDate: new Date(),
    role: 'employee',
  });
  empId = String(emp._id);

  const login = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.data.token;
  };
  adminToken = await login('admin@test.com', 'Admin@12345');
  hrToken = await login('hr@test.com', 'Hr@123456');
  empToken = await login('emp@test.com', 'Emp@123456');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Employee CRUD & RBAC', () => {
  it('allows HR to create a new employee', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'New Hire',
        email: 'newhire@test.com',
        phone: '+911234567893',
        password: 'NewHire@123',
        department: 'Engineering',
        designation: 'Junior Developer',
        salary: 30000,
        joiningDate: '2024-01-01',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.employeeId).toMatch(/^EMP\d{4}$/);
  });

  it('forbids HR from assigning super_admin role', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Sneaky Admin',
        email: 'sneaky@test.com',
        phone: '+911234567894',
        password: 'Sneaky@123',
        department: 'Engineering',
        designation: 'Dev',
        salary: 30000,
        joiningDate: '2024-01-01',
        role: 'super_admin',
      });
    expect(res.statusCode).toBe(403);
  });

  it('forbids a regular employee from listing all employees', async () => {
    const res = await request(app).get('/api/employees').set('Authorization', `Bearer ${empToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('allows a regular employee to view their own profile', async () => {
    const res = await request(app)
      .get(`/api/employees/${empId}`)
      .set('Authorization', `Bearer ${empToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('emp@test.com');
  });

  it('forbids an employee from editing restricted fields on their own profile', async () => {
    const res = await request(app)
      .put(`/api/employees/${empId}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ salary: 999999 });
    expect(res.statusCode).toBe(200);
    // salary should remain unchanged since it's not in the self-update allow-list
    expect(res.body.data.salary).toBe(40000);
  });

  it('prevents circular reporting chains', async () => {
    const admin = await Employee.findOne({ email: 'admin@test.com' });
    // Make emp report to admin
    await request(app)
      .patch(`/api/employees/${empId}/manager`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reportingManager: String(admin._id) });

    // Now try to make admin report to emp -> should fail (would create a cycle)
    const res = await request(app)
      .patch(`/api/employees/${admin._id}/manager`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reportingManager: empId });
    expect(res.statusCode).toBe(400);
  });

  it('only allows super_admin to delete (soft delete) an employee', async () => {
    const hrAttempt = await request(app)
      .delete(`/api/employees/${empId}`)
      .set('Authorization', `Bearer ${hrToken}`);
    expect(hrAttempt.statusCode).toBe(403);

    const adminAttempt = await request(app)
      .delete(`/api/employees/${empId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAttempt.statusCode).toBe(200);

    const check = await Employee.findById(empId);
    expect(check).toBeNull(); // excluded by default find due to soft-delete middleware
  });
});
