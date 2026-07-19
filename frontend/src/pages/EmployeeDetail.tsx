import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { Card, RoleBadge, StatusBadge } from '../components/ui';
import type { ApiResponse, Employee } from '../types';

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reportees, setReportees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<Employee>>(`/employees/${id}`),
      api.get<ApiResponse<Employee[]>>(`/employees/${id}/reportees`),
    ])
      .then(([empRes, repRes]) => {
        setEmployee(empRes.data.data);
        setReportees(repRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!employee) return <div className="text-sm text-red-500">Employee not found.</div>;

  const manager =
    employee.reportingManager && typeof employee.reportingManager === 'object'
      ? employee.reportingManager
      : null;

  return (
    <div className="space-y-6">
      <Link to="/employees" className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" /> Back to employees
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <p className="text-slate-500 dark:text-slate-400">
              {employee.designation} · {employee.department}
            </p>
            <div className="mt-2 flex gap-2">
              <RoleBadge role={employee.role} />
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Employee ID" value={employee.employeeId} />
          <Field label="Email" value={employee.email} />
          <Field label="Phone" value={employee.phone} />
          <Field label="Salary" value={`₹${employee.salary.toLocaleString('en-IN')}`} />
          <Field label="Joining Date" value={new Date(employee.joiningDate).toLocaleDateString()} />
          <Field label="Reporting Manager" value={manager ? `${manager.name} (${manager.employeeId})` : '—'} />
        </dl>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Direct Reports ({reportees.length})</h2>
        {reportees.length === 0 ? (
          <p className="text-sm text-slate-400">No direct reports.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {reportees.map((r) => (
              <li key={r._id} className="flex items-center justify-between py-2">
                <div>
                  <Link to={`/employees/${r._id}`} className="font-medium hover:text-indigo-600">
                    {r.name}
                  </Link>
                  <p className="text-xs text-slate-400">{r.designation}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
