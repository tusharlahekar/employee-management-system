const { parse } = require('csv-parse/sync');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const Employee = require('../models/Employee');
const { selfUpdateAllowedFields } = require('../middleware/validate');

// GET /api/employees
// Query params: page, limit, search, department, role, status, sortBy, order
exports.getEmployees = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    department,
    role,
    status,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const allowedSortFields = ['name', 'joiningDate', 'createdAt', 'salary', 'department'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .populate('reportingManager', 'name employeeId designation'),
    Employee.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: employees,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// GET /api/employees/:id
exports.getEmployeeById = asyncHandler(async (req, res) => {
  // Employees may only view their own profile
  if (req.user.role === 'employee' && req.params.id !== String(req.user._id)) {
    throw new ApiError(403, 'You can only view your own profile.');
  }

  const employee = await Employee.findById(req.params.id).populate(
    'reportingManager',
    'name employeeId designation email'
  );
  if (!employee) throw new ApiError(404, 'Employee not found');

  res.status(200).json({ success: true, data: employee });
});

// POST /api/employees  (super_admin, hr_manager)
exports.createEmployee = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  // HR Managers cannot assign the super_admin role
  if (req.user.role === 'hr_manager' && payload.role === 'super_admin') {
    throw new ApiError(403, 'HR Managers cannot assign the Super Admin role.');
  }

  if (payload.reportingManager) {
    const manager = await Employee.findById(payload.reportingManager);
    if (!manager) throw new ApiError(400, 'Reporting manager not found.');
  }

  if (!payload.password) {
    throw new ApiError(400, 'Password is required when creating an employee.');
  }

  const employee = await Employee.create(payload);
  res.status(201).json({ success: true, message: 'Employee created', data: employee.toSafeObject() });
});

// PUT /api/employees/:id
exports.updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isSelf = String(req.user._id) === String(id);

  const employee = await Employee.findById(id).select('+password');
  if (!employee) throw new ApiError(404, 'Employee not found');

  let updates = { ...req.body };

  if (req.user.role === 'employee') {
    if (!isSelf) throw new ApiError(403, 'You can only edit your own profile.');
    // Restrict to a limited field set
    updates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => selfUpdateAllowedFields.includes(key))
    );
  } else if (req.user.role === 'hr_manager') {
    if (updates.role === 'super_admin') {
      throw new ApiError(403, 'HR Managers cannot assign the Super Admin role.');
    }
    if (employee.role === 'super_admin' && updates.role) {
      throw new ApiError(403, 'HR Managers cannot modify a Super Admin.');
    }
  }
  // super_admin: no extra field restrictions

  // Prevent circular reporting chains
  if (updates.reportingManager) {
    if (String(updates.reportingManager) === String(id)) {
      throw new ApiError(400, 'An employee cannot report to themselves.');
    }
    const wouldCreateCycle = await isCircularReport(id, updates.reportingManager);
    if (wouldCreateCycle) {
      throw new ApiError(400, 'This assignment would create a circular reporting chain.');
    }
  }

  Object.assign(employee, updates);
  await employee.save();

  res.status(200).json({ success: true, message: 'Employee updated', data: employee.toSafeObject() });
});

// DELETE /api/employees/:id  (soft delete, super_admin only)
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (String(req.user._id) === String(id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  const employee = await Employee.findById(id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  employee.isDeleted = true;
  employee.deletedAt = new Date();
  employee.status = 'inactive';
  await employee.save({ validateBeforeSave: false });

  // Detach direct reports so hierarchy stays consistent
  await Employee.updateMany({ reportingManager: id }, { $set: { reportingManager: null } });

  res.status(200).json({ success: true, message: 'Employee soft-deleted' });
});

// GET /api/employees/:id/reportees
exports.getReportees = asyncHandler(async (req, res) => {
  const reportees = await Employee.find({ reportingManager: req.params.id }).select(
    'name employeeId email designation department status'
  );
  res.status(200).json({ success: true, data: reportees });
});

// PATCH /api/employees/:id/manager
exports.assignManager = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reportingManager } = req.body;

  if (reportingManager) {
    if (String(reportingManager) === String(id)) {
      throw new ApiError(400, 'An employee cannot report to themselves.');
    }
    const manager = await Employee.findById(reportingManager);
    if (!manager) throw new ApiError(400, 'Reporting manager not found.');

    const wouldCreateCycle = await isCircularReport(id, reportingManager);
    if (wouldCreateCycle) {
      throw new ApiError(400, 'This assignment would create a circular reporting chain.');
    }
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    { reportingManager: reportingManager || null },
    { new: true, runValidators: true }
  );
  if (!employee) throw new ApiError(404, 'Employee not found');

  res.status(200).json({ success: true, message: 'Reporting manager updated', data: employee });
});

// POST /api/employees/import  (CSV import, super_admin, hr_manager)
exports.importCSV = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required (field name: file).');

  let records;
  try {
    records = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new ApiError(400, `Could not parse CSV: ${err.message}`);
  }

  const results = { created: 0, failed: [] };

  for (const [index, row] of records.entries()) {
    try {
      if (row.role === 'super_admin' && req.user.role !== 'super_admin') {
        throw new Error('Only Super Admin can import Super Admin rows.');
      }
      await Employee.create({
        name: row.name,
        email: row.email,
        phone: row.phone,
        password: row.password || 'Welcome@123',
        department: row.department,
        designation: row.designation,
        salary: Number(row.salary),
        joiningDate: row.joiningDate,
        status: row.status || 'active',
        role: row.role || 'employee',
      });
      results.created += 1;
    } catch (err) {
      results.failed.push({ row: index + 2, error: err.message });
    }
  }

  res.status(200).json({ success: true, message: 'CSV import complete', data: results });
});

// Helper: walk up the reporting chain from `managerId` to see if it ever reaches `employeeId`
async function isCircularReport(employeeId, managerId) {
  let currentId = managerId;
  const visited = new Set();

  while (currentId) {
    if (String(currentId) === String(employeeId)) return true;
    if (visited.has(String(currentId))) break; // safety against pre-existing bad data
    visited.add(String(currentId));

    const current = await Employee.findById(currentId).select('reportingManager');
    if (!current) break;
    currentId = current.reportingManager;
  }
  return false;
}
