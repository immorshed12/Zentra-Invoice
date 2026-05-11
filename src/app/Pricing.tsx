import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  Check, 
  Zap, 
  Building2, 
  Rocket, 
  ArrowRight,
  Loader2,
  ShieldCheck,
  Globe,
  ChevronLeft
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, PlanType } from '../constants';
import { logBillingEvent } from '../services/billingService';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Pricing() {
  const { company, profile, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleUpgrade = async (planKey: PlanType) => {
    if (!profile?.company_id) return;
    setLoading(planKey);
    
    // In a real app, this would redirect to Stripe Checkout
    // For this simulation, we'll directly update the database with a "Mock Payment Success"
    
    try {
      const prevPlan = company?.plan_type || 'free';
      const { error } = await supabase
        .from('companies')
        .update({ 
          plan_type: planKey,
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('id', profile.company_id);

      if (error) throw error;
      
      // Log audit event
      await logBillingEvent({
        company_id: profile.company_id,
        event_type: 'plan_changed',
        previous_plan: prevPlan,
        new_plan: planKey,
        amount: SUBSCRIPTION_PLANS[planKey.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS].price,
        details: { method: 'simulation' }
      });

      await refreshUser();
      alert(`Success! You have been upgraded to the ${planKey.toUpperCase()} plan.`);
      navigate('/settings');
    } catch (err: any) {
      alert('Error updating subscription: ' + err.message);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    { ...SUBSCRIPTION_PLANS.FREE, icon: Rocket, color: 'text-gray-600', btnColor: 'bg-gray-100 text-gray-900 border border-gray-200' },
    { ...SUBSCRIPTION_PLANS.PRO, icon: Zap, color: 'text-blue-600', btnColor: 'bg-blue-600 text-white shadow-lg shadow-blue-100' },
    { ...SUBSCRIPTION_PLANS.BUSINESS, icon: Building2, color: 'text-purple-600', btnColor: 'bg-purple-600 text-white shadow-lg shadow-purple-100' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex justify-start">
           <button 
             onClick={() => navigate('/settings')}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm"
           >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              {t('back')}
           </button>
        </div>

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest"
          >
            <ShieldCheck className="h-4 w-4" />
            Flexible Pricing
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black text-gray-900 tracking-tight leading-tight"
          >
            The best tools for your <span className="text-blue-600">Business growth</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-medium text-lg leading-relaxed"
          >
            Simple, transparent pricing that grows with you. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
           {plans.map((plan, idx) => {
             const isCurrent = company?.plan_type === plan.id;
             const isPro = plan.id === 'pro';

             return (
               <motion.div 
                 key={plan.id}
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className={cn(
                   "relative p-10 rounded-[40px] bg-white border border-gray-100 flex flex-col transition-all",
                   isPro ? "shadow-2xl shadow-blue-100 ring-2 ring-blue-600 scale-105 z-10" : "shadow-xl shadow-gray-100 hover:shadow-2xl"
                 )}
               >
                 {isPro && (
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                     Most Popular
                   </div>
                 )}

                 <div className="mb-8 space-y-4">
                   <div className={cn("inline-flex p-4 rounded-3xl bg-gray-50", plan.color)}>
                      <plan.icon className="h-8 w-8" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight">{plan.name}</h3>
                     <div className="flex items-baseline gap-1 mt-2">
                       <span className="text-4xl font-black text-gray-900">$</span>
                       <span className="text-5xl font-black text-gray-900 tracking-tighter">{plan.price}</span>
                       <span className="text-gray-400 font-bold">/mo</span>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4 flex-1 mb-10">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                         <div className="mt-1 h-5 w-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                            <Check className="h-3 w-3" strokeWidth={3} />
                         </div>
                         <span className="text-sm font-bold text-gray-600 leading-tight">{feature}</span>
                      </div>
                    ))}
                 </div>

                 <button 
                   onClick={() => handleUpgrade(plan.id as PlanType)}
                   disabled={isCurrent || loading !== null}
                   className={cn(
                     "w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                     isCurrent ? "bg-gray-100 text-gray-400 cursor-not-allowed" : plan.btnColor
                   )}
                 >
                   {loading === plan.id ? (
                     <Loader2 className="h-5 w-5 animate-spin" />
                   ) : (
                     <>
                        {isCurrent ? 'Current Plan' : `Get ${plan.name}`}
                        {!isCurrent && <ArrowRight className="h-4 w-4" />}
                     </>
                   )}
                 </button>
               </motion.div>
             );
           })}
        </div>

        <div className="text-center">
            <p className="text-gray-400 font-bold text-sm italic">
               Interested in a custom plan? <a href="mailto:sales@zentra.io" className="text-blue-600 underline">Contact Sales</a>
            </p>
        </div>
      </div>
    </div>
  );
}
