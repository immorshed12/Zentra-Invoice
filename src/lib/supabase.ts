import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const validateUrl = (url: string | undefined): string => {
  if (!url) return 'https://placeholder-dont-use.supabase.co';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return 'https://placeholder-dont-use.supabase.co';
  } catch {
    return 'https://placeholder-dont-use.supabase.co';
  }
};

const safeUrl = validateUrl(supabaseUrl);

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseUrl.includes('placeholder') &&
  safeUrl === supabaseUrl
);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing, invalid, or using placeholders.');
}

export const supabase = createClient(
  safeUrl,
  supabaseAnonKey || 'placeholder'
);
