/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useTranslation } from 'react-i18next';
import './i18n';

// Pages
import Login from './app/auth/Login';
import Signup from './app/auth/Signup';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverview from './app/dashboard/DashboardOverview';
import Customers from './app/dashboard/Customers';
import Products from './app/dashboard/Products';
import InvoiceList from './app/dashboard/InvoiceList';
import InvoiceForm from './app/dashboard/InvoiceForm';
import InvoiceDetail from './app/dashboard/InvoiceDetail';
import Settings from './app/dashboard/Settings';
import Analytics from './app/dashboard/Analytics';
import LandingPage from './app/LandingPage';
import AcceptInvite from './app/AcceptInvite';
import Pricing from './app/Pricing';
import Onboarding from './app/Onboarding';
import { Toaster } from 'react-hot-toast';

import { AlertCircle, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuthStore();
  
  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Allow /onboarding if we are already there
  const isAtOnboarding = window.location.pathname.includes('/onboarding');

  if (!profile || !profile.onboarding_completed) {
    if (isAtOnboarding) return <>{children}</>;
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

export default function App() {
  const { initialize, user, profile, loading, error } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle RTL based on language
  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl text-center space-y-6 border border-red-100">
          <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Configuration Required</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              To use Zentra Invoice, you need to connect your Supabase project.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3">
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">How to fix:</p>
             <ol className="text-sm text-gray-600 space-y-2 font-medium list-decimal list-inside">
                <li>Check <span className="font-bold text-gray-900">GitHub Actions</span> secrets if deployed on GitHub.</li>
                <li>Ensure <code className="bg-gray-200 px-1.5 py-0.5 rounded text-red-600 font-bold">VITE_SUPABASE_URL</code> is set.</li>
                <li>Ensure <code className="bg-gray-200 px-1.5 py-0.5 rounded text-red-600 font-bold">VITE_SUPABASE_ANON_KEY</code> is set.</li>
                <li>Wait for the GitHub Action to finish building.</li>
             </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
          >
            <RefreshCw className="h-5 w-5" />
            Check Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="relative">
           <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
           <div className="absolute inset-0 flex items-center justify-center font-black text-[10px] text-blue-600 uppercase tracking-widest">Zen</div>
        </div>
      </div>
    );
  }

  if (error && error.includes('fetch')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl text-center space-y-6">
          <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-500">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Network Error</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              We couldn't connect to the server. Please check your internet connection and try again.
            </p>
          </div>
          <button 
            onClick={() => initialize()}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route 
          path="/onboarding" 
          element={user ? <Onboarding /> : <Navigate to="/login" />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><DashboardLayout><DashboardOverview /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/analytics" 
          element={<ProtectedRoute><DashboardLayout><Analytics /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/customers" 
          element={<ProtectedRoute><DashboardLayout><Customers /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/products" 
          element={<ProtectedRoute><DashboardLayout><Products /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/invoices" 
          element={<ProtectedRoute><DashboardLayout><InvoiceList /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/invoices/new" 
          element={<ProtectedRoute><DashboardLayout><InvoiceForm /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/invoices/:id" 
          element={<ProtectedRoute><DashboardLayout><InvoiceDetail /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/invoices/edit/:id" 
          element={<ProtectedRoute><DashboardLayout><InvoiceForm /></DashboardLayout></ProtectedRoute>} 
        />
        <Route 
          path="/settings" 
          element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  </ErrorBoundary>
  );
}
