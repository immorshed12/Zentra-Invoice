import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-member'>('loading');
  const [inviteData, setInviteData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const verifyInvite = async () => {
      if (!token) {
        setStatus('error');
        setErrorMsg('Invalid invitation link.');
        setLoading(false);
        return;
      }

      // 1. Get invite data
      const { data: invite, error: inviteError } = await supabase
        .from('invitations')
        .select('*, companies(name_en)')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        setStatus('error');
        setErrorMsg('This invitation is invalid or has already been used.');
        setLoading(false);
        return;
      }

      setInviteData(invite);

      // 2. Check if user is already in a company
      if (user && profile?.company_id) {
         if (profile.company_id === invite.company_id) {
            setStatus('already-member');
            setLoading(false);
            return;
         }
      }

      // 3. If user is logged in, we can process it
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            company_id: invite.company_id,
            role: invite.role 
          })
          .eq('id', user.id);

        if (updateError) {
          setStatus('error');
          setErrorMsg(updateError.message);
        } else {
          // Mark invite as accepted
          await supabase.from('invitations').update({ status: 'accepted' }).eq('id', invite.id);
          
          setStatus('success');
          await refreshUser();
        }
      } else {
        // User needs to login/register
        setStatus('loading'); // Just keep loading state or show "Please login"
      }
      setLoading(false);
    };

    verifyInvite();
  }, [token, user, profile]);

  if (!user && !loading && status !== 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">You've been invited!</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Join <strong>{inviteData?.companies?.name_en}</strong> on Zentra Invoice. 
              Please login or create an account to accept this invitation.
            </p>
          </div>
          <button 
            onClick={() => navigate('/login', { state: { redirectTo: `/accept-invite/${token}` } })}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all"
          >
            Login to Accept
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-12 shadow-2xl text-center"
      >
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="font-bold text-gray-600">Verifying invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Welcome Aboard!</h2>
              <p className="text-gray-500 font-medium">You have successfully joined {inviteData?.companies?.name_en}.</p>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'already-member' && (
          <div className="space-y-6">
            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <p className="font-bold text-gray-900">You are already a member of this company!</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all font-black uppercase tracking-widest text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Oops!</h2>
              <p className="text-red-600 font-bold">{errorMsg}</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all"
            >
              Return Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
