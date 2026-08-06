/**
 * Layout Components
 * ============================================================
 * Header, Sidebar, and main Layout wrapper.
 */

import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import {
  LayoutDashboard,
  Zap,
  FileText,
  TrendingUp,
  Settings,
  Activity,
  Menu,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/generate', icon: Zap, label: 'Generate' },
  { path: '/policies', icon: FileText, label: 'Policies' },
  { path: '/flywheel', icon: TrendingUp, label: 'Flywheel' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/health', icon: Activity, label: 'System Health', adminOnly: true },
];

export function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A1A]/80 backdrop-blur-md border-b border-[#2A2A4A]">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-[#141428] text-[#A0A0B8] hover:text-white transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0055FF] to-[#0088FF] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Policy-0</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#141428] border border-[#2A2A4A] flex items-center justify-center">
              <User className="w-4 h-4 text-[#A0A0B8]" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#0055FF]" />
                <span className="text-xs text-[#A0A0B8] capitalize">{user?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-[#141428] text-[#A0A0B8] hover:text-[#FF3355] transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  const { sidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const location = useLocation();

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 bottom-0 z-30 w-64 bg-[#0A0A1A] border-r border-[#2A2A4A] transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <nav className="p-4 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#0055FF]/10 text-[#0055FF] border border-[#0055FF]/30'
                  : 'text-[#A0A0B8] hover:text-white hover:bg-[#141428]'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-[#0A0A1A]">
      <Header />
      <Sidebar />
      <main
        className={clsx(
          'transition-all duration-300 pt-6 pb-12 px-6',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        {children}
      </main>
    </div>
  );
}