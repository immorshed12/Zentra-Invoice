import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  company: any | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: any | null) => void;
  setCompany: (company: any | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  company: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setCompany: (company) => set({ company }),
  refreshUser: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid errors when not found
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        // Handle potential plural/singular differences in join
        const companyData = profile.company || (profile.companies as any);
        set({ profile, company: companyData });
      }
    } catch (err: any) {
      console.error('Error refreshing user:', err);
    }
  },
  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ 
        user: null, 
        profile: null, 
        company: null, 
        loading: false 
      });
      // Force clear local storage to be safe
      localStorage.removeItem('supabase.auth.token');
    } catch (err: any) {
      console.error('Error signing out:', err);
      set({ loading: false });
    }
  },
  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      const user = session?.user ?? null;
      set({ user });

      if (user) {
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, company:companies(*)')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
           console.error('Profile fetch error:', profileError);
        }
        
        // If user exists but no profile, create a default one
        if (!profile && user) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              onboarding_completed: false
            })
            .select()
            .single();
          
          if (!createError) {
            profile = newProfile;
          }
        }

        if (profile) {
          const companyData = profile.company || (profile.companies as any);
          set({ profile, company: companyData });
        }
      }
    } catch (err: any) {
      console.error('Supabase initialization error:', err);
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      set({ user });
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, company:companies(*)')
            .eq('id', user.id)
            .maybeSingle();
          if (profile) {
            const companyData = profile.company || (profile.companies as any);
            set({ profile, company: companyData });
          }
        } catch (err) {
          console.error('Error in onAuthStateChange:', err);
        }
      } else {
        set({ profile: null, company: null });
      }
    });
  },
}));
