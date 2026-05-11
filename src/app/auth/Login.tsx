import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(t('logging_in') || 'Logging in...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setLoading(false);
    } else {
      toast.success(t('login_success') || 'Welcome back!', { id: toastId });
    }
  };

  const toggleLang = () => {
    const langs = ['en', 'ar', 'bn'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <Link to="/" className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Home
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {t('login')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('sign_in_to_account')}
            </p>
          </div>
          <button 
            onClick={toggleLang}
            className="text-xs font-medium text-blue-600 hover:text-blue-500 bg-blue-50 px-2 py-1 rounded shadow-sm border border-blue-100"
          >
            {i18n.language === 'en' ? 'العربية' : i18n.language === 'ar' ? 'বাংলা' : 'English'}
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <label htmlFor="email-address" className="sr-only">
                {t('email')}
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pr-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:line-height-6 rtl:pl-0 rtl:pr-10"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                {t('password')}
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pr-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-lg border-0 py-3 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:line-height-6 rtl:pl-0 rtl:pr-10"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 rtl:left-auto rtl:right-0 rtl:pr-3">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-100" />
                )}
              </span>
              {t('login')}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            {t('dont_have_account')}{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
              {t('signup')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
