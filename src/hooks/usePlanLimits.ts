import { useAuthStore } from '../store/authStore';
import { SUBSCRIPTION_PLANS, PlanType } from '../constants';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export function usePlanLimits() {
  const { company, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    invoices: 0,
    team_members: 0
  });

  useEffect(() => {
    async function fetchCounts() {
      if (!profile?.company_id || !company) {
        setLoading(false);
        return;
      }

      try {
        // Check if we need to reset the usage cycle (simulated cron logic)
        const resetAt = new Date(company.usage_reset_at || company.created_at);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (resetAt < thirtyDaysAgo) {
          // Reset the cycle
          await supabase
            .from('companies')
            .update({ usage_reset_at: now.toISOString() })
            .eq('id', profile.company_id);
        }

        const cycleStart = resetAt.toISOString();

        const [invoicesCount, teamCount] = await Promise.all([
          supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', profile.company_id)
            .gte('created_at', cycleStart),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', profile.company_id)
        ]);

        setCounts({
          invoices: invoicesCount.count || 0,
          team_members: teamCount.count || 0
        });
      } catch (err) {
        console.error('Error fetching plan limits counts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, [profile?.company_id, company?.usage_reset_at]);

  const planType = (company?.plan_type || 'free') as PlanType;
  const plan = SUBSCRIPTION_PLANS[planType.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];

  const limits = {
    canCreateInvoice: counts.invoices < plan.limits.invoices_per_month,
    canInviteMember: counts.team_members < plan.limits.team_members,
    hasAnalytics: plan.limits.analytics,
    hasCustomBranding: plan.limits.custom_branding,
    maxInvoices: plan.limits.invoices_per_month,
    maxTeamMembers: plan.limits.team_members,
    currentInvoices: counts.invoices,
    currentTeamMembers: counts.team_members,
    planName: plan.name
  };

  return { limits, loading };
}
