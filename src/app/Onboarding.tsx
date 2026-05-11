import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Upload, 
  Users, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Sparkles,
  Camera,
  Globe,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const STEPS = [
  { id: 'company', title: 'Company Details', icon: Building2 },
  { id: 'branding', title: 'Branding', icon: Camera },
  { id: 'first_steps', title: 'Final Steps', icon: Sparkles }
];

export default function Onboarding() {
  const { profile, company, refreshUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name_en: company?.name_en || '',
    address: company?.address || '',
    default_currency: company?.default_currency || 'USD',
    tax_rate: company?.tax_rate || 15,
    logo_url: company?.logo_url || '',
    logo_settings: company?.logo_settings || {
      width: 120,
      padding: 0,
      objectFit: 'contain' as 'contain' | 'cover' | 'fill',
      alignment: 'center' as 'left' | 'center' | 'right'
    }
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const updateLogoSettings = (settings: Partial<typeof formData.logo_settings>) => {
     setFormData(prev => ({
       ...prev,
       logo_settings: { ...prev.logo_settings, ...settings }
     }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.company_id) {
      if (!profile?.company_id) alert("Please save company details first.");
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.company_id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('Logo')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Logo')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      
      // Update company immediately with logo
      await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', profile.company_id);
        
      await refreshUser();
    } catch (err: any) {
      alert("Upload failed: " + err.message + ". \n\nAction Required: Go to your Supabase Dashboard -> Storage -> Create a new PUBLIC bucket named 'Logo' (Case-sensitive).");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    setLoading(true);
    const toastId = toast.loading('Saving your business profiles...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found. Please try logging in again.");

      let currentCompanyId = profile?.company_id;

      // Prepare data for Supabase
      const payload = {
        name_en: formData.name_en,
        address: formData.address,
        default_currency: formData.default_currency,
        tax_rate: formData.tax_rate,
        logo_url: formData.logo_url,
        settings: {
          ...company?.settings,
          logo_settings: formData.logo_settings
        }
      };

      // 1. If no company linked, create or link one
      if (!currentCompanyId) {
        const generatedId = crypto.randomUUID();
        const { error: companyError } = await supabase
          .from('companies')
          .insert([{ id: generatedId, ...payload }]);
        
        if (companyError) throw companyError;
        currentCompanyId = generatedId;

        // 2. Upsert profile to link
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            email: user.email,
            company_id: currentCompanyId, 
            onboarding_step: currentStep + 1 
          });
        
        if (profileError) throw profileError;
      } else {
        // 3. Update existing company
        const { error: companyUpdateError } = await supabase
          .from('companies')
          .update(payload)
          .eq('id', currentCompanyId);
        
        if (companyUpdateError) throw companyUpdateError;

        await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            email: user.email,
            onboarding_step: currentStep + 1 
          });
      }
      
      await refreshUser();
      toast.success('Information saved!', { id: toastId });
      nextStep();
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err.message || "Failed to save information", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setLoading(true);
    const toastId = toast.loading('Finalizing setup...');
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          email: user.email,
          onboarding_completed: true 
        });
      
      if (error) throw error;
      await refreshUser();
      toast.success('Welcome to your dashboard!', { id: toastId });
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
             {STEPS.map((step, idx) => (
               <div 
                 key={step.id} 
                 className={cn(
                   "flex flex-col items-center gap-2",
                   idx <= currentStep ? "text-blue-600" : "text-gray-300"
                 )}
               >
                 <div className={cn(
                   "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                   idx < currentStep ? "bg-green-500 text-white" : 
                   idx === currentStep ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : 
                   "bg-white border border-gray-100 text-gray-300"
                 )}>
                   {idx < currentStep ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest">{step.title}</span>
               </div>
             ))}
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
               className="h-full bg-blue-600"
             />
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 p-10 relative overflow-hidden border border-gray-100">
           <AnimatePresence mode="wait">
             {currentStep === 0 && (
               <motion.div 
                 key="step0"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-8"
               >
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Let's set up your business</h2>
                    <p className="text-gray-500 font-medium">Please provide basic details about your company.</p>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Name</label>
                       <input 
                         type="text"
                         value={formData.name_en}
                         onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                         className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-600 font-bold transition-all"
                         placeholder="e.g. Zentra Solutions"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Default Currency</label>
                          <select 
                            value={formData.default_currency}
                            onChange={e => setFormData({ ...formData, default_currency: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-600 font-bold transition-all"
                          >
                             <option value="USD">USD ($)</option>
                             <option value="SAR">SAR (ر.س)</option>
                             <option value="BDT">BDT (৳)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tax Rate (%)</label>
                          <input 
                            type="number"
                            value={formData.tax_rate}
                            onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-blue-600 font-bold transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleUpdateCompany}
                   disabled={loading || !formData.name_en}
                   className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:opacity-50"
                 >
                   {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                     <>
                        Continue to Branding
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                     </>
                   )}
                 </button>
               </motion.div>
             )}

             {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2 text-center">
                    <div 
                      className={cn(
                        "bg-gray-50 rounded-[30px] flex items-center justify-center text-blue-600 mx-auto mb-6 overflow-hidden border border-gray-100 shadow-inner",
                        formData.logo_settings.alignment === 'left' ? 'justify-start' : 
                        formData.logo_settings.alignment === 'right' ? 'justify-end' : 'justify-center'
                      )}
                      style={{ 
                        height: '200px', 
                        width: '100%',
                        padding: `${formData.logo_settings.padding}px`
                      }}
                    >
                       {formData.logo_url ? (
                         <img 
                            src={formData.logo_url} 
                            alt="Logo" 
                            className="h-full"
                            style={{ 
                              objectFit: formData.logo_settings.objectFit,
                              maxWidth: `${formData.logo_settings.width}%`,
                              width: 'auto'
                            }} 
                         />
                       ) : (
                         <div className="flex flex-col items-center gap-2">
                            <Camera className="h-10 w-10 text-gray-300" />
                            <span className="text-xs font-bold text-gray-400">Preview will appear here</span>
                         </div>
                       )}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Style your brand</h2>
                    <p className="text-gray-500 font-medium">Fine-tune how your logo appears on your invoices.</p>
                  </div>

                  {formData.logo_url && (
                    <div className="grid grid-cols-2 gap-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo Size</label>
                          <input 
                            type="range" 
                            min="20" 
                            max="100" 
                            value={formData.logo_settings.width}
                            onChange={(e) => updateLogoSettings({ width: Number(e.target.value) })}
                            className="w-full"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Padding</label>
                          <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            value={formData.logo_settings.padding}
                            onChange={(e) => updateLogoSettings({ padding: Number(e.target.value) })}
                            className="w-full"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Positioning (Fit)</label>
                          <div className="flex gap-2">
                             {(['contain', 'cover', 'fill'] as const).map(fit => (
                               <button
                                 key={fit}
                                 onClick={() => updateLogoSettings({ objectFit: fit })}
                                 className={cn(
                                   "flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all",
                                   formData.logo_settings.objectFit === fit 
                                   ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                                   : "bg-white text-gray-400 border border-gray-100"
                                 )}
                               >
                                 {fit}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alignment</label>
                          <div className="flex gap-2">
                             {(['left', 'center', 'right'] as const).map(align => (
                               <button
                                 key={align}
                                 onClick={() => updateLogoSettings({ alignment: align })}
                                 className={cn(
                                   "flex-1 py-2 rounded-xl text-[10px] font-bold capitalize transition-all",
                                   formData.logo_settings.alignment === align 
                                   ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                                   : "bg-white text-gray-400 border border-gray-100"
                                 )}
                               >
                                 {align}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-[40px] bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer group relative">
                     <input 
                       type="file" 
                       className="hidden" 
                       accept="image/*" 
                       onChange={handleLogoUpload}
                       disabled={loading}
                     />
                     <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                     </div>
                     <p className="mt-4 text-sm font-bold text-gray-400">
                        {formData.logo_url ? 'Choose different logo' : 'Upload your logo'}
                     </p>
                  </label>

                  <div className="flex gap-4">
                     <button 
                       onClick={prevStep}
                       className="flex-1 py-5 bg-gray-100 text-gray-900 font-black rounded-2xl hover:bg-gray-200 transition-all"
                     >
                        Back
                     </button>
                     <button 
                       onClick={handleUpdateCompany}
                       className="flex-[2] py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group"
                     >
                        {formData.logo_url ? 'Looks perfect!' : 'Skip branding'}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
                </motion.div>
             )}

             {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 text-center"
                >
                  <div className="space-y-2">
                    <div className="h-24 w-24 bg-green-50 rounded-[40px] flex items-center justify-center text-green-500 mx-auto mb-6 relative">
                       <CheckCircle2 className="h-12 w-12" />
                       <motion.div 
                         initial={{ scale: 0 }}
                         animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
                         transition={{ repeat: Infinity, duration: 2 }}
                         className="absolute inset-0 bg-green-500 rounded-[40px]"
                       />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">You're all set!</h2>
                    <p className="text-gray-500 font-medium">Your business workspace is ready. Let's start invoicing.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                     <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        <h4 className="font-black text-blue-900 text-sm">Add Team</h4>
                        <p className="text-xs text-blue-800/60 font-medium leading-relaxed">Invite your team to collaborate in your organization.</p>
                     </div>
                     <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 space-y-2">
                        <Globe className="h-6 w-6 text-purple-600" />
                        <h4 className="font-black text-purple-900 text-sm">Global Settings</h4>
                        <p className="text-xs text-purple-800/60 font-medium leading-relaxed">Customize localized invoices for your region.</p>
                     </div>
                  </div>

                  <button 
                    onClick={handleComplete}
                    className="w-full py-6 bg-blue-600 text-white font-black rounded-[28px] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                    Enter Dashboard
                    <ArrowRight className="h-6 w-6" />
                  </button>
                </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Logout Fallback */}
        <div className="mt-8 text-center text-gray-400">
          <button 
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 hover:text-red-500 font-bold transition-colors group"
          >
            <div className="h-8 w-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-xs uppercase tracking-widest text-gray-400 group-hover:text-red-500 transition-colors">Log out and return to sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
