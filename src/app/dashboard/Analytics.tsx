import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, Clock, DollarSign, Wallet, FileCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function Analytics() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    customerCount: 0
  });

  useEffect(() => {
    async function fetchStats() {
      if (!profile?.company_id) return;
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, status, created_at')
        .eq('company_id', profile.company_id);
      
      const { count: customers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      if (invoices) {
        const paid = invoices.filter(inv => inv.status === 'paid');
        const unpaid = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue');
        const rev = paid.reduce((acc, inv) => acc + Number(inv.total_amount), 0);
        
        setStats({
          totalRevenue: rev,
          paidInvoices: paid.length,
          unpaidInvoices: unpaid.length,
          customerCount: customers || 0
        });

        // Group by month for chart
        const monthlyData = invoices.reduce((acc: any, inv) => {
          const month = new Date(inv.created_at).toLocaleString('default', { month: 'short' });
          if (!acc[month]) acc[month] = { month, amount: 0 };
          if (inv.status === 'paid') acc[month].amount += Number(inv.total_amount);
          return acc;
        }, {});
        
        setData(Object.values(monthlyData));
      }
    }
    fetchStats();
  }, [profile?.company_id]);

  return (
    <div className="space-y-8 text-start">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Business Intelligence</h1>
        <p className="text-gray-500 font-medium">Real-time performance analytics for your company.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
               <DollarSign className="h-5 w-5" />
            </div>
            <div>
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Collected</p>
               <h3 className="text-2xl font-black text-gray-900 mt-1">${stats.totalRevenue.toLocaleString()}</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
               <FileCheck className="h-5 w-5" />
            </div>
            <div>
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Paid Invoices</p>
               <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.paidInvoices}</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
               <Clock className="h-5 w-5" />
            </div>
            <div>
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending Payment</p>
               <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.unpaidInvoices}</h3>
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
               <Wallet className="h-5 w-5" />
            </div>
            <div>
               <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Customers</p>
               <h3 className="text-2xl font-black text-gray-900 mt-1">{stats.customerCount}</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-black text-gray-900 tracking-tight">Revenue Overflow</h3>
               <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% vs Prev Month
               </div>
            </div>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.length > 0 ? data : [{ month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }]}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Active Usage</h3>
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.length > 0 ? data : [{ month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F9FAFB' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
