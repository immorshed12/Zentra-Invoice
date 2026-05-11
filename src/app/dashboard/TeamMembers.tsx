import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  Loader2, 
  Trash2, 
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, ArrowRight as ArrowRightIcon } from 'lucide-react';

export default function TeamMembers() {
  const { profile, company } = useAuthStore();
  const { limits } = usePlanLimits();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'staff' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    
    // Fetch members
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', profile.company_id);
    
    // Fetch invites
    const { data: invitesData } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('status', 'pending');

    setMembers(profilesData || []);
    setInvites(invitesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id || !profile?.id) return;
    
    setInviteLoading(true);
    setMessage(null);

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { error } = await supabase
      .from('invitations')
      .insert({
        company_id: profile.company_id,
        email: inviteForm.email,
        role: inviteForm.role,
        inviter_id: profile.id,
        token: token,
        status: 'pending'
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: `Invitation sent to ${inviteForm.email}` });
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'staff' });
      fetchData();
      
      // Also add a notification for the system
      await supabase.from('notifications').insert({
        company_id: profile.company_id,
        title_en: 'Team Member Invited',
        message_en: `${inviteForm.email} has been invited as ${inviteForm.role}`,
        type: 'system'
      });
    }
    setInviteLoading(false);
  };

  const removeMember = async (memberId: string) => {
    if (memberId === profile?.id) {
       alert("You cannot remove yourself");
       return;
    }
    if (!confirm("Are you sure you want to remove this member?")) return;

    const { error } = await supabase
      .from('profiles')
      .update({ company_id: null, role: 'staff' })
      .eq('id', memberId);

    if (error) alert(error.message);
    else fetchData();
  };

  const cancelInvite = async (id: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  if (loading) return (
    <div className="p-12 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-start">
      {!limits.canInviteMember && (
         <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
         >
           <div className="flex items-center gap-4">
             <div className="h-14 w-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
               <AlertTriangle className="h-8 w-8" />
             </div>
             <div className="text-start">
               <h3 className="text-lg font-black text-orange-900 leading-tight">Team capacity reached!</h3>
               <p className="text-orange-800/70 font-medium">Your current {limits.planName} plan only allows {limits.maxTeamMembers} users.</p>
             </div>
           </div>
           <button 
             onClick={() => navigate('/pricing')}
             className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 whitespace-nowrap"
           >
             <Crown className="h-5 w-5" />
             Expand Capacity
           </button>
         </motion.div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Team Members</h3>
          <p className="text-gray-500 text-sm font-medium">Manage access for your organization.</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
          <button 
            onClick={() => setShowInviteModal(true)}
            disabled={!limits.canInviteMember}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            Invite Member
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Members List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
             <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Members</h4>
          </div>
          <div className="divide-y divide-gray-50">
            {members.map((member) => (
              <div key={member.id} className="p-6 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-lg shadow-sm border border-blue-100">
                    {member.full_name?.[0] || member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{member.full_name || 'Unnamed User'}</p>
                    <p className="text-xs text-gray-500 font-medium">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                    member.role === 'admin' ? "bg-purple-50 text-purple-700 border-purple-100" : 
                    member.role === 'manager' ? "bg-blue-50 text-blue-700 border-blue-100" : 
                    "bg-gray-50 text-gray-600 border-gray-100"
                  )}>
                    {member.role}
                  </span>
                  {member.id !== profile?.id && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <button 
                      onClick={() => removeMember(member.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
               <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending Invitations</h4>
            </div>
            <div className="divide-y divide-gray-50">
              {invites.map((invite) => (
                <div key={invite.id} className="p-6 flex items-center justify-between bg-gray-50/20 group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{invite.email}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Waiting for response...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                      {invite.role}
                    </span>
                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                      <button 
                        onClick={() => cancelInvite(invite.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Cancel Invitation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowInviteModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                    <Users className="h-6 w-6" />
                  </div>
                  <button onClick={() => setShowInviteModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Invite Member</h3>
                  <p className="text-gray-500 text-sm font-medium">Add a new user to {company?.name_en}</p>
                </div>

                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Email Address</label>
                    <input 
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium"
                      placeholder="colleague@example.com"
                      value={inviteForm.email}
                      onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Access Role</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold"
                      value={inviteForm.role}
                      onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option value="staff">Staff (Basic View/Create)</option>
                      <option value="manager">Manager (Operations)</option>
                      <option value="admin">Admin (Full Control)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={inviteLoading}
                      className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {inviteLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                      Send Invitation
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={cn(
            "fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] border",
            message.type === 'success' ? "bg-green-600 text-white border-green-500" : "bg-red-600 text-white border-red-500"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 underline" /> : <XCircle className="h-5 w-5" />}
          <span className="font-black text-sm">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4 hover:opacity-50"><XCircle className="h-4 w-4" /></button>
        </motion.div>
      )}
    </div>
  );
}
