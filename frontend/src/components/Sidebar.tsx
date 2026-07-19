import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Network,
  UserCircle,
  Building2,
} from 'lucide-react';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`;

export default function Sidebar() {
  const { user } = useAuth();
  const canManage = user?.role === 'super_admin' || user?.role === 'hr_manager';

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Building2 className="h-7 w-7 text-indigo-600" />
        <span className="text-lg font-bold">EMS</span>
      </div>
      <nav className="flex flex-col gap-1">
        {canManage && (
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </NavLink>
        )}
        {canManage && (
          <NavLink to="/employees" className={linkClass}>
            <Users className="h-4 w-4" /> Employees
          </NavLink>
        )}
        <NavLink to="/organization" className={linkClass}>
          <Network className="h-4 w-4" /> Organization
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <UserCircle className="h-4 w-4" /> My Profile
        </NavLink>
      </nav>
    </aside>
  );
}
