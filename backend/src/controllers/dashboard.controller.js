const asyncHandler = require('../utils/asyncHandler');
const Employee = require('../models/Employee');

// GET /api/dashboard/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [total, active, inactive, departmentAgg, roleAgg] = await Promise.all([
    Employee.countDocuments({}),
    Employee.countDocuments({ status: 'active' }),
    Employee.countDocuments({ status: 'inactive' }),
    Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
    Employee.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalEmployees: total,
      activeEmployees: active,
      inactiveEmployees: inactive,
      departmentCount: departmentAgg.length,
      byDepartment: departmentAgg.map((d) => ({ department: d._id, count: d.count })),
      byRole: roleAgg.map((r) => ({ role: r._id, count: r.count })),
    },
  });
});
