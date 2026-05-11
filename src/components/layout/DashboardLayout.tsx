import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  BarChart,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { usePlanLimits } from '../../hooks/usePlanLimits';

import NotificationBell from '../NotificationBell';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
  [key: string]: any;
}

const NavItem = ({ to, icon: Icon, label, active, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
        : "text-gray-600 hover:bg-gray-100"
    )}
  >
    <Icon className={cn("h-5 w-5", active ? "text-white" : "text-gray-400 group-hover:text-blue-600")} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, company, signOut } = useAuthStore();
  const { limits } = usePlanLimits();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    ...(limits.hasAnalytics ? [{ to: '/analytics', icon: BarChart, label: 'Analytics' }] : []),
    { to: '/invoices', icon: FileText, label: t('invoices') },
    { to: '/customers', icon: Users, label: t('customers') },
    { to: '/products', icon: Package, label: t('products') },
    ...(profile?.role !== 'staff' ? [{ to: '/settings', icon: Settings, label: t('settings') }] : []),
  ];

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Use window.location.href for a full refresh to clear any cached states
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-200 p-6 fixed h-full inset-y-0 rtl:right-0 rtl:left-auto ltr:left-0 ltr:right-auto">
        <div className="flex items-center gap-3 px-2 mb-10">
          {company?.logo_url ? (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-sm border border-gray-100">
               <img src={company.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <FileText className="text-white h-6 w-6" />
            </div>
          )}
          <span className="text-xl font-bold text-gray-900 tracking-tight">{t('app_name')}</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
               {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {profile?.full_name || t('user')}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {company?.name_en || t('company')}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium group disabled:opacity-50"
          >
            {isLoggingOut ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 text-red-400 group-hover:text-red-600" />
            )}
            {isLoggingOut ? t('signing_out') : t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 rtl:lg:pl-0 rtl:lg:pr-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto rtl:ml-0 rtl:mr-auto">
            <NotificationBell />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 md:p-8 flex-1">
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
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 flex flex-col shadow-2xl lg:hidden rtl:left-auto rtl:right-0 rtl:translate-x-full"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  {company?.logo_url ? (
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-100">
                       <img src={company.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="text-white h-5 w-5" />
                    </div>
                  )}
                  <span className="text-lg font-bold text-gray-900">{t('app_name')}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    active={location.pathname === item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                  {isLoggingOut ? t('signing_out') : t('logout')}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
