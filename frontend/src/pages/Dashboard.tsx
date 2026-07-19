import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Users, UserCheck, UserX, Building2 } from 'lucide-react';
import api from '../api/axios';
import { Card } from '../components/ui';
import type { ApiResponse, DashboardStats } from '../types';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<DashboardStats>>('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  }
  if (!stats) {
    return <div className="text-sm text-red-500">Could not load dashboard stats.</div>;
  }

  const cards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'text-indigo-600' },
    { label: 'Active Employees', value: stats.activeEmployees, icon: UserCheck, color: 'text-emerald-600' },
    { label: 'Inactive Employees', value: stats.inactiveEmployees, icon: UserX, color: 'text-red-500' },
    { label: 'Departments', value: stats.departmentCount, icon: Building2, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.label}</p>
              <p className="mt-1 text-3xl font-bold">{c.value}</p>
            </div>
            <c.icon className={`h-9 w-9 ${c.color}`} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Employees by Department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.byDepartment}>
              <XAxis dataKey="department" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Employees by Role</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.byRole}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry: any) => `${entry.role}: ${entry.count}`}
              >
                {stats.byRole.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
