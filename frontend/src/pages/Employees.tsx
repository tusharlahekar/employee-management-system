import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Card, Pagination, RoleBadge, StatusBadge } from '../components/ui';
import EmployeeForm from '../components/EmployeeForm';
import CSVImport from '../components/CSVImport';
import { useAuth } from '../context/AuthContext';
import type { ApiResponse, Employee, Pagination as PaginationT } from '../types';

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationT | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('joiningDate');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<Employee[]>>('/employees', {
        params: { page, limit: 10, search, department, role, status, sortBy, order },
      })
      .then((res) => {
        setEmployees(res.data.data);
        setPagination(res.data.pagination ?? null);
      })
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, [page, search, department, role, status, sortBy, order]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300); // debounce search
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Soft-delete ${emp.name}? This can be reversed by an administrator.`)) return;
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success('Employee removed');
      fetchEmployees();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const inputClass =
    'rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700';

  const canDelete = user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex gap-2">
          <CSVImport onDone={fetchEmployees} />
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search name or email"
              className={`${inputClass} w-full pl-9`}
            />
          </div>
          <input
            value={department}
            onChange={(e) => {
              setPage(1);
              setDepartment(e.target.value);
            }}
            placeholder="Filter department"
            className={inputClass}
          />
          <select
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
            className={inputClass}
          >
            <option value="">All roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="hr_manager">HR Manager</option>
            <option value="employee">Employee</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className={inputClass}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={`${sortBy}:${order}`}
            onChange={(e) => {
              const [sb, ord] = e.target.value.split(':');
              setSortBy(sb);
              setOrder(ord as 'asc' | 'desc');
            }}
            className={inputClass}
          >
            <option value="joiningDate:desc">Newest joined</option>
            <option value="joiningDate:asc">Oldest joined</option>
            <option value="name:asc">Name A-Z</option>
            <option value="name:desc">Name Z-A</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Designation</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Joined</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-slate-400">
                        {emp.employeeId} · {emp.email}
                      </p>
                    </td>
                    <td className="py-3 pr-4">{emp.department}</td>
                    <td className="py-3 pr-4">{emp.designation}</td>
                    <td className="py-3 pr-4">
                      <RoleBadge role={emp.role} />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="py-3 pr-4">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/employees/${emp._id}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditing(emp);
                            setShowForm(true);
                          }}
                          className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(emp)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        )}
      </Card>

      {showForm && (
        <EmployeeForm
          employee={editing}
          managers={employees}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
}
