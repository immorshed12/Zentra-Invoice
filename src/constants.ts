export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    price_id: null,
    limits: {
      invoices_per_month: 5,
      team_members: 1,
      analytics: false,
      export_pdf: true,
      custom_branding: false
    },
    features: [
      'Up to 5 invoices / month',
      '1 Team Member',
      'Multi-currency support',
      'Arabic & English PDF',
      'Standard Support'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    price_id: 'price_pro_monthly', // Placeholder for Stripe
    limits: {
      invoices_per_month: 50,
      team_members: 5,
      analytics: true,
      export_pdf: true,
      custom_branding: true
    },
    features: [
      'Up to 50 invoices / month',
      '5 Team Members',
      'Full Business Analytics',
      'Custom Email Branding',
      'WhatsApp Integration',
      'Priority Support'
    ]
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    price: 99,
    price_id: 'price_business_monthly', // Placeholder for Stripe
    limits: {
      invoices_per_month: 1000000, // Unlimited
      team_members: 20,
      analytics: true,
      export_pdf: true,
      custom_branding: true
    },
    features: [
      'Unlimited Invoices',
      '20 Team Members',
      'Advanced Reporting',
      'Dedicated Account Manager',
      'Bulk Data Export',
      'API Access (Coming Soon)'
    ]
  }
};

export type PlanType = 'free' | 'pro' | 'business';
