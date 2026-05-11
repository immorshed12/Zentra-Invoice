import { supabase } from '../lib/supabase';

export type BillingEventType = 
  | 'subscription_started' 
  | 'payment_success' 
  | 'payment_failed' 
  | 'plan_changed';

interface BillingLogParams {
  company_id: string;
  event_type: BillingEventType;
  previous_plan?: string;
  new_plan?: string;
  amount?: number;
  details?: any;
}

export const logBillingEvent = async (params: BillingLogParams) => {
  try {
    const { error } = await supabase
      .from('billing_audit_logs')
      .insert({
        company_id: params.company_id,
        event_type: params.event_type,
        previous_plan: params.previous_plan,
        new_plan: params.new_plan,
        amount: params.amount,
        details: params.details || {}
      });

    if (error) throw error;
  } catch (err) {
    console.error('Failed to log billing event:', err);
  }
};
