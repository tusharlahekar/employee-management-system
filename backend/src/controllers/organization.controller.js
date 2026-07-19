const asyncHandler = require('../utils/asyncHandler');
const Employee = require('../models/Employee');

// GET /api/organization/tree
// Builds a nested tree starting from all employees with no reporting manager (roots)
exports.getOrgTree = asyncHandler(async (req, res) => {
  const employees = await Employee.find({}).select(
    'name employeeId email designation department status role reportingManager'
  );

  const byId = {};
  employees.forEach((emp) => {
    byId[emp._id] = { ...emp.toObject(), children: [] };
  });

  const roots = [];
  employees.forEach((emp) => {
    const node = byId[emp._id];
    if (emp.reportingManager && byId[emp.reportingManager]) {
      byId[emp.reportingManager].children.push(node);
    } else {
      roots.push(node);
    }
  });

  res.status(200).json({ success: true, data: roots });
});
