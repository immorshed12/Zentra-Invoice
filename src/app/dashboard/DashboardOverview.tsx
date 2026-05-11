import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  PieChart as PieChartIcon,
  Loader2,
  Crown,
  Zap,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { cn } from '../../lib/utils';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend, trendValue }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      {trendValue && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
          trend === 'up' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</h3>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-400 font-medium">{subtext}</p>}
    </div>
  </motion.div>
);

export default function DashboardOverview() {
  const { profile, company } = useAuthStore();
  const { limits, loading: limitsLoading } = usePlanLimits();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    invoices: any[];
    customersCount: number;
  }>({ invoices: [], customersCount: 0 });
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    async function fetchStats() {
      if (!profile?.company_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', profile.company_id);
      
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      setData({
        invoices: invoices || [],
        customersCount: customersCount || 0
      });
      setLoading(false);
    }
    fetchStats();
  }, [profile?.company_id]);

  const stats = useMemo(() => {
    const invoices = data.invoices;
    const gross = invoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    const collected = invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    const unpaid = invoices.filter(i => i.status === 'unpaid').reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    const overdue = invoices.filter(i => i.status === 'overdue').reduce((acc, inv) => acc + (inv.total_amount || 0), 0);
    
    return {
      gross,
      collected,
      unpaid,
      overdue,
      count: invoices.length,
      customers: data.customersCount
    };
  }, [data]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const monthInvoices = data.invoices.filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      return {
        name: month,
        revenue: monthInvoices.reduce((acc, inv) => acc + (inv.total_amount || 0), 0),
        collected: monthInvoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + (inv.total_amount || 0), 0)
      };
    });
    
    return monthlyData;
  }, [data]);

  const pieData = useMemo(() => {
    const statuses = ['paid', 'unpaid', 'overdue', 'draft'];
    return statuses.map(status => ({
      name: status.toUpperCase(),
      value: data.invoices.filter(inv => inv.status === status).length
    })).filter(item => item.value > 0);
  }, [data]);

  const COLORS = ['#2563EB', '#F59E0B', '#DC2626', '#9CA3AF'];

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  const isEmpty = data.invoices.length === 0 && data.customersCount === 0;

  return (
    <div className="space-y-8 text-start">
      {isEmpty ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-dashed border-gray-100 rounded-[40px] p-16 text-center space-y-8"
        >
          <div className="h-24 w-24 bg-blue-50 rounded-[40px] flex items-center justify-center text-blue-600 mx-auto">
             <Sparkles className="h-12 w-12" />
          </div>
          <div className="space-y-3 max-w-md mx-auto">
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome to Zentra, {profile?.full_name?.split(' ')[0]}!</h2>
             <p className="text-gray-500 font-medium">Your workspace is ready. Let's create your first customer and send your first professional invoice today.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
               onClick={() => navigate('/customers')}
               className="px-8 py-4 bg-gray-100 text-gray-900 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center gap-2"
             >
                <Users className="h-5 w-5" />
                Add Customer
             </button>
             <button 
               onClick={() => navigate('/invoices/new')}
               className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
             >
                <FileText className="h-5 w-5" />
                Create First Invoice
             </button>
          </div>
        </motion.div>
      ) : (
        <>
          {company?.plan_type === 'free' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100"
            >
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Crown className="h-32 w-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight leading-tight">Scale your business with <span className="text-blue-200">Zentra Pro</span></h2>
              <p className="text-blue-100 font-medium">Unlock unlimited invoices, team collaboration, and advanced business analytics.</p>
            </div>
            <button 
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-xl whitespace-nowrap active:scale-95"
            >
              <Zap className="h-5 w-5" />
              Upgrade Now
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">
            Visualizing {company?.name_en}'s performance
          </p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase transition-all",
                timeRange === range ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Gross Revenue" 
          value={`${company?.default_currency} ${stats.gross.toLocaleString()}`} 
          subtext={`From ${stats.count} invoices`}
          icon={TrendingUp} 
          color="bg-blue-600"
          trend="up"
          trendValue="Live"
        />
        <StatCard 
          title="Collected" 
          value={`${company?.default_currency} ${stats.collected.toLocaleString()}`} 
          subtext="Amount paid by customers"
          icon={DollarSign} 
          color="bg-green-600"
        />
        <StatCard 
          title="Total Customers" 
          value={stats.customers} 
          subtext="Active business relationships"
          icon={Users} 
          color="bg-purple-600"
        />
        <StatCard 
          title="Overdue" 
          value={`${company?.default_currency} ${stats.overdue.toLocaleString()}`} 
          subtext="Action required immediately"
          icon={Clock} 
          color="bg-red-600"
          trend={stats.overdue > 0 ? "down" : "up"}
          trendValue={stats.overdue > 0 ? "Warning" : "Clear"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Revenue Analytics</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monthly trend for {new Date().getFullYear()}</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <span className="h-3 w-3 bg-blue-600 rounded-full" />
                     <span className="text-xs font-bold text-gray-500">Gross</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="h-3 w-3 bg-blue-100 rounded-full" />
                     <span className="text-xs font-bold text-gray-500">Collected</span>
                  </div>
               </div>
            </div>
            
            <div className="h-72 w-full">
              {data.invoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                  <p className="font-bold opacity-50 italic">No revenue data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="name" 
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
                      labelStyle={{ fontWeight: 'black', marginBottom: '4px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#2563EB" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="collected" 
                      stroke="#DBEAFE" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
        </div>

        {/* Status Breakdwon */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Invoice Status</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Current distribution</p>
            
            <div className="flex-1 min-h-[250px] relative">
              {data.invoices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <PieChartIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p className="font-bold opacity-50 italic">Waiting for invoices...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-3 mt-4">
               {pieData.map((item, index) => (
                 <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <span className="text-xs font-bold text-gray-500">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{item.value}</span>
                 </div>
               ))}
            </div>
        </div>
      </div>
    </>)}
    </div>
  );
}
