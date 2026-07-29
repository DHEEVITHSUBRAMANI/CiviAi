import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Menu, Moon, Sun, LogOut, Home, LayoutDashboard, PlusCircle,
  ClipboardList, Users, BarChart3, Map, User, HardHat, Eye, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { Avatar } from './ui/Badge';
import { cn } from '../lib/utils';
import type { UserRole } from '../types';

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  citizen: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'New Complaint', icon: PlusCircle, path: '/complaints/new' },
    { label: 'My Complaints', icon: ClipboardList, path: '/complaints' },
    { label: 'Track Issue', icon: Map, path: '/track' },
    { label: 'Profile', icon: User, path: '/profile' },
  ],
  officer: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'All Complaints', icon: ClipboardList, path: '/complaints' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Field Workers', icon: Users, path: '/workers' },
    { label: 'Heatmap', icon: Map, path: '/heatmap' },
    { label: 'Profile', icon: User, path: '/profile' },
  ],
  worker: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'My Tasks', icon: ClipboardList, path: '/complaints' },
    { label: 'Map', icon: Map, path: '/track' },
    { label: 'Profile', icon: User, path: '/profile' },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  citizen: 'Citizen',
  officer: 'Municipal Officer',
  worker: 'Field Worker',
};

const ROLE_ICONS: Record<UserRole, typeof User> = {
  citizen: User,
  officer: Building2,
  worker: HardHat,
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!profile) return null;

  const navItems = NAV_BY_ROLE[profile.role];
  const RoleIcon = ROLE_ICONS[profile.role];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30">
        <SidebarContent
          profile={profile}
          navItems={navItems}
          RoleIcon={RoleIcon}
          isActive={isActive}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Sidebar - mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 lg:hidden"
            >
              <SidebarContent
                profile={profile}
                navItems={navItems}
                RoleIcon={RoleIcon}
                isActive={isActive}
                onSignOut={handleSignOut}
                onNavigate={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {navItems.find((n) => isActive(n.path))?.label ?? 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/transparency"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Public Dashboard
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <NotificationBell />
              <Link to="/profile" className="ml-1">
                <Avatar name={profile.full_name} src={profile.avatar_url || undefined} size="sm" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  profile, navItems, RoleIcon, isActive, onSignOut, onNavigate,
}: {
  profile: NonNullable<ReturnType<typeof useAuth>['profile']>;
  navItems: NavItem[];
  RoleIcon: typeof User;
  isActive: (path: string) => boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 p-5 border-b border-gray-200 dark:border-gray-800">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={onNavigate}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-gov-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-gray-900 dark:text-white">CivicConnect</p>
            <p className="text-[10px] text-brand-600 dark:text-brand-400 tracking-wider">AI POWERED</p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar name={profile.full_name} src={profile.avatar_url || undefined} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{profile.full_name}</p>
            <div className="flex items-center gap-1.5">
              <RoleIcon className="w-3 h-3 text-brand-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[profile.role]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
              isActive(item.path)
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isActive(item.path) && <ChevronRight className="w-4 h-4" />}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
