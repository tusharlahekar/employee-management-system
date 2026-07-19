import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import type { ApiResponse, Employee, Role, Status } from '../types';
import { useAuth } from '../context/AuthContext';

interface Props {
  employee: Employee | null;
  managers: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  department: '',
  designation: '',
  salary: '',
  joiningDate: '',
  status: 'active' as Status,
  role: 'employee' as Role,
  reportingManager: '',
};

export default function EmployeeForm({ employee, managers, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(employee);
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        password: '',
        department: employee.department,
        designation: employee.designation,
        salary: String(employee.salary),
        joiningDate: employee.joiningDate.slice(0, 10),
        status: employee.status,
        role: employee.role,
        reportingManager:
          typeof employee.reportingManager === 'object' && employee.reportingManager
            ? employee.reportingManager._id
            : (employee.reportingManager as string) || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [employee]);

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
        salary: Number(form.salary),
        joiningDate: form.joiningDate,
        status: form.status,
        role: form.role,
        reportingManager: form.reportingManager || null,
      };
      if (form.password) payload.password = form.password;

      if (isEdit && employee) {
        await api.put<ApiResponse<Employee>>(`/employees/${employee._id}`, payload);
        toast.success('Employee updated');
      } else {
        await api.post<ApiResponse<Employee>>('/employees', payload);
        toast.success('Employee created');
      }
      onSaved();
    } catch (err: any) {
      const messages: string[] = err?.response?.data?.errors || [];
      toast.error(messages[0] || err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-bold">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input required className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              required
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input required className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Password {isEdit && <span className="text-xs text-slate-400">(leave blank to keep)</span>}
            </label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required={!isEdit}
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Department</label>
            <input
              required
              className={inputClass}
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Designation</label>
            <input
              required
              className={inputClass}
              value={form.designation}
              onChange={(e) => update('designation', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Salary</label>
            <input
              required
              type="number"
              min={0}
              className={inputClass}
              value={form.salary}
              onChange={(e) => update('salary', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Joining Date</label>
            <input
              required
              type="date"
              className={inputClass}
              value={form.joiningDate}
              onChange={(e) => update('joiningDate', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select className={inputClass} value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="employee">Employee</option>
              <option value="hr_manager">HR Manager</option>
              <option value="super_admin" disabled={!isSuperAdmin}>
                Super Admin {!isSuperAdmin && '(Super Admin only)'}
              </option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Reporting Manager</label>
            <select
              className={inputClass}
              value={form.reportingManager}
              onChange={(e) => update('reportingManager', e.target.value)}
            >
              <option value="">None</option>
              {managers
                .filter((m) => m._id !== employee?._id)
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.employeeId}) — {m.designation}
                  </option>
                ))}
            </select>
          </div>

          <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
