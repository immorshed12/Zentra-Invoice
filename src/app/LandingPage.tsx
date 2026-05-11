import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  Globe2, 
  Users2, 
  ShieldCheck, 
  ArrowRight,
  BarChart3,
  MousePointerClick,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';

const LandingPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <FileText className="text-white h-6 w-6" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight italic">Zentra</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors tracking-wide">Features</a>
              <Link to="/pricing" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors tracking-wide">Pricing</Link>
              {user ? (
                <Link 
                  to="/dashboard" 
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors">Login</Link>
                  <Link 
                    to="/signup" 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Professional Invoicing for Modern Teams
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]"
            >
              Master Your <span className="text-blue-600">Business</span> Invoicing Flows.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto"
            >
              Zentra provides a complete suite for professional invoicing, multi-tenant management, 
              and global reach with native English, Arabic, and Bangla support.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link 
                to="/signup" 
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-2xl text-lg font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-2 group"
              >
                Create Free Account
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/pricing" 
                className="w-full sm:w-auto px-10 py-5 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl text-lg font-black hover:bg-gray-50 transition-all translate-y-0 active:translate-y-px"
              >
                View Plans
              </Link>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-24 relative max-w-5xl mx-auto group"
          >
            <div className="absolute inset-0 bg-blue-600 blur-[120px] opacity-10 rounded-full group-hover:opacity-15 transition-opacity" />
            <div className="relative bg-white rounded-[3rem] p-4 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 aspect-[16/10] overflow-hidden">
               <div className="w-full h-full bg-gray-50 rounded-[2.2rem] border border-gray-100 flex items-center justify-center overflow-hidden">
                  <div className="text-gray-200 font-black text-7xl uppercase tracking-tighter italic opacity-50 transform -rotate-12 select-none">
                    DASHBOARD_LIVE
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-40 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-24 space-y-4 max-w-2xl">
             <div className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">The Zentra Advantage</div>
             <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">Everything you need to scale globally.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-24">
            <div className="space-y-6 group">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                <Globe2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Global Language Support</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Native support for English, Arabic, and Bangla. Expand your business reach across the globe with localized invoicing and RTL support.
              </p>
            </div>
            
            <div className="space-y-6 group">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                <Users2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Team Management</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Invite your staff, define roles (Admin, Staff, Manager), and manage permissions. Collaborate seamlessly with your entire team.
              </p>
            </div>

            <div className="space-y-6 group">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Smart Invoicing</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Create beautiful, PDF-ready invoices in seconds. Manage products, recurring customers, and payment statuses effortlessly from one hub.
              </p>
            </div>

            <div className="space-y-6 group">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Rich Analytics</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Track your revenue, unpaid invoices, and top-performing products with interactive charts and automated financial insights.
              </p>
            </div>

            <div className="space-y-6 group">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Data Sovereignty</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Your data is secure with multi-tenant isolation and encrypted storage. We prioritize privacy and security at every layer.
              </p>
            </div>

            <div className="space-y-6 group">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200/50 group-hover:scale-110 transition-transform">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Mobile Ready</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Manage your business on the go. Our desktop-grade performance is optimized for any screen size, from mobile to tablet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-[4rem] p-12 md:p-32 relative overflow-hidden text-center border-8 border-gray-800">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-600 opacity-20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-400 opacity-20 rounded-full blur-[120px]" />
            
            <div className="relative space-y-12">
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none max-w-4xl mx-auto">Ready to simplify your business?</h2>
              <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Join modern businesses that trust Zentra for their professional invoicing and management requirements.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link 
                  to="/signup" 
                  className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-2xl text-xl font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-900/50 active:scale-95"
                >
                  Start Global Invoicing
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-12 py-6 bg-gray-800 text-white border border-gray-700 rounded-2xl text-xl font-black hover:bg-gray-700 transition-all active:scale-95"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="h-8 w-8 bg-gray-900 group-hover:bg-blue-600 transition-colors rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight italic text-gray-900 group-hover:text-blue-600 transition-colors">Zentra</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
               <a href="#features" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Features</a>
               <Link to="/pricing" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Pricing</Link>
               <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Login</Link>
               <Link to="/signup" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Register</Link>
            </div>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              © 2026 Zentra Invoice
            </div>
          </div>
          
          <div className="mt-12 pt-12 border-t border-gray-50 text-center">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
              Precision Built for Multi-Tenant Global Platforms
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
