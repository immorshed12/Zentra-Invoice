import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  FileText, 
  Globe, 
  Save, 
  Upload, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  Plus,
  UserMinus,
  Mail,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  X
} from 'lucide-react';
import TeamMembers from './TeamMembers';
import { cn } from '../../lib/utils';
import { SUBSCRIPTION_PLANS } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { exportToCSV } from '../../lib/exportUtils';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../lib/cropUtils';

type SettingsTab = 'company' | 'invoice' | 'team' | 'billing' | 'data' | 'preferences';

export default function Settings() {
  const { company, profile, refreshUser } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Cropper State
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [formData, setFormData] = useState({
    name_en: company?.name_en || '',
    name_ar: company?.name_ar || '',
    address: company?.address || '',
    address_ar: company?.address_ar || '',
    default_currency: company?.default_currency || 'USD',
    tax_rate: company?.tax_rate || 15,
    logo_url: company?.logo_url || '',
    settings: {
      invoice_prefix: company?.settings?.invoice_prefix || 'INV',
      tax_type: company?.settings?.tax_type || 'exclusive',
      starting_number: company?.settings?.starting_number || 1
    }
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name_en: company.name_en || '',
        name_ar: company.name_ar || '',
        address: company.address || '',
        address_ar: company.address_ar || '',
        default_currency: company.default_currency || 'USD',
        tax_rate: company.tax_rate || 15,
        logo_url: company.logo_url || '',
        settings: {
          invoice_prefix: company.settings?.invoice_prefix || 'INV',
          tax_type: company.settings?.tax_type || 'exclusive',
          starting_number: company.settings?.starting_number || 1
        }
      });
    }
  }, [company]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id) return;
    
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('companies')
      .update({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        address: formData.address,
        address_ar: formData.address_ar,
        default_currency: formData.default_currency,
        tax_rate: formData.tax_rate,
        logo_url: formData.logo_url,
        settings: formData.settings
      })
      .eq('id', company.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: t('settings_updated') });
      await refreshUser();
    }
    setLoading(false);
  };

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company?.id) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCroppingImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    });
    reader.readAsDataURL(file);
  };

  const uploadCroppedImage = async () => {
    if (!croppingImage || !croppedAreaPixels || !company?.id) return;

    setLoading(true);
    try {
      const croppedImageBlob = await getCroppedImg(croppingImage, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Failed to crop image');

      const fileName = `${company.id}/${Math.random()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('Logo')
        .upload(fileName, croppedImageBlob, { 
          upsert: true,
          contentType: 'image/png'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Logo')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      
      // Update company immediately
      await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', company.id);

      setMessage({ type: 'success', text: 'Logo updated successfully' });
      setCroppingImage(null);
      setLoading(false);
      await refreshUser();
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setMessage({ type: 'error', text: "Upload failed: " + err.message });
      setLoading(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'company', label: t('company_info'), icon: Building2 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: Zap },
    { id: 'data', label: 'Data & Backup', icon: Shield },
    { id: 'invoice', label: t('invoice_settings'), icon: FileText },
    { id: 'preferences', label: t('preferences'), icon: Globe },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-start">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('settings')}</h1>
        <p className="text-gray-500 font-medium mt-2">Manage your business profile and preferences.</p>
      </div>

      {message && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4",
          message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
        )}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-8 space-y-8">
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="space-y-4">
                  <label className="text-sm font-black text-gray-400 uppercase tracking-widest block">Logo</label>
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden p-2">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="max-h-full max-w-full object-contain drop-shadow-sm" />
                      ) : (
                        <Building2 className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-all">
                       {formData.logo_url && (
                         <button 
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                           className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                         >
                            <UserMinus className="h-3 w-3" />
                         </button>
                       )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-all rounded-3xl backdrop-blur-sm">
                      <Upload className="text-white h-6 w-6" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">{t('company_name_en')}</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium"
                      value={formData.name_en}
                      onChange={e => setFormData({...formData, name_en: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 text-end block">{t('company_name_ar')}</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium text-end"
                      value={formData.name_ar}
                      onChange={e => setFormData({...formData, name_ar: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('address')}</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 text-end block">{t('address_ar')}</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium text-end"
                    value={formData.address_ar}
                    onChange={e => setFormData({...formData, address_ar: e.target.value})}
                  />
                </div>
              </div>

              <div className="w-full md:w-1/3 space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('currency')}</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold"
                  value={formData.default_currency}
                  onChange={e => setFormData({...formData, default_currency: e.target.value})}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="BDT">BDT - Bangladeshi Taka</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('invoice_prefix')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-black"
                    value={formData.settings.invoice_prefix}
                    onChange={e => setFormData({
                      ...formData, 
                      settings: { ...formData.settings, invoice_prefix: e.target.value.toUpperCase() }
                    })}
                  />
                  <p className="text-xs text-gray-400 font-medium italic">Example: {formData.settings.invoice_prefix}-0001</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Starting Number</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold"
                    value={formData.settings.starting_number}
                    onChange={e => setFormData({
                      ...formData, 
                      settings: { ...formData.settings, starting_number: parseInt(e.target.value) || 1 }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('default_tax_rate')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold"
                      value={formData.tax_rate}
                      onChange={e => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">{t('tax_type')}</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, settings: { ...formData.settings, tax_type: 'exclusive' }})}
                      className={cn(
                        "py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                        formData.settings.tax_type === 'exclusive' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                      )}
                    >
                      {t('exclusive')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, settings: { ...formData.settings, tax_type: 'inclusive' }})}
                      className={cn(
                        "py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                        formData.settings.tax_type === 'inclusive' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                      )}
                    >
                      {t('inclusive')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && <TeamMembers />}

          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                     <Zap className="h-32 w-32" />
                  </div>
                  <div className="relative z-10 space-y-6">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-blue-100 text-xs font-black uppercase tracking-widest">Active Plan</p>
                           <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                              {company?.plan_type?.toUpperCase() || 'FREE'} PLAN
                              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase">Active</span>
                           </h3>
                        </div>
                        <button 
                          onClick={() => navigate('/pricing')}
                          className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl hover:bg-blue-50 transition-all text-sm shadow-xl"
                        >
                           Manage Subscription
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-sm font-bold">
                              <span>Monthly Invoices</span>
                              <span>Unlimited</span>
                           </div>
                           <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '10%' }}
                                className="h-full bg-white"
                              />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-sm font-bold">
                              <span>Team Capacity</span>
                              <span>{SUBSCRIPTION_PLANS[(company?.plan_type?.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS) || 'FREE']?.limits.team_members} Users</span>
                           </div>
                           <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '20%' }}
                                className="h-full bg-white"
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                     <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <CreditCard className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Payment Method</p>
                        <p className="font-black text-gray-900 mt-1">Visa ending in **** 4242</p>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                     <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <TrendingUp className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Next Invoice</p>
                        <p className="font-black text-gray-900 mt-1">$29.00 on June 5, 2026</p>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                     <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <Shield className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Billing Support</p>
                        <button className="text-blue-600 font-bold hover:underline mt-1 text-sm">Download History</button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in fade-in duration-300 text-start">
               <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">Data Portability</h3>
                  <p className="text-gray-500 font-medium">Export your business data for archiving or external processing.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                           <FileText className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="font-black text-gray-900">Invoices</h4>
                           <p className="text-xs text-gray-500 font-medium">Download full history in CSV</p>
                        </div>
                     </div>
                     <button 
                       onClick={async () => {
                         const { data } = await supabase.from('invoices').select('*').eq('company_id', profile?.company_id);
                         if (data) exportToCSV(data, 'zentra_invoices');
                       }}
                       className="w-full py-4 rounded-xl bg-gray-50 text-gray-900 font-bold hover:bg-gray-100 transition-all border border-gray-200"
                     >
                        Export Invoices
                     </button>
                  </div>

                  <div className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                           <Users className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="font-black text-gray-900">Customers</h4>
                           <p className="text-xs text-gray-500 font-medium">Download client directory</p>
                        </div>
                     </div>
                     <button 
                       onClick={async () => {
                         const { data } = await supabase.from('customers').select('*').eq('company_id', profile?.company_id);
                         if (data) exportToCSV(data, 'zentra_customers');
                       }}
                       className="w-full py-4 rounded-xl bg-gray-50 text-gray-900 font-bold hover:bg-gray-100 transition-all border border-gray-200"
                     >
                        Export Customers
                     </button>
                  </div>
               </div>

               <div className="p-8 rounded-[32px] bg-red-50 border border-red-100 space-y-4">
                  <div className="flex items-center gap-3 text-red-600">
                     <AlertTriangle className="h-6 w-6" />
                     <h4 className="font-bold">Security Compliance</h4>
                  </div>
                  <p className="text-sm text-red-800/70 font-medium leading-relaxed">
                     Your data is backed up daily to multiple regional clusters. Access is strictly isolated per tenant using Row-Level Security (RLS). 
                     You can request a full architectural security audit by contacting our enterprise support team.
                  </p>
               </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="space-y-4">
                  <label className="text-sm font-black text-gray-400 uppercase tracking-widest block">{t('language')}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button
                        type="button"
                        onClick={() => i18n.changeLanguage('en')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                          i18n.language === 'en' ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200"
                        )}
                     >
                        <div className="flex items-center gap-3 text-start">
                           <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-blue-600">EN</div>
                           <div>
                              <p className="font-bold text-gray-900">English</p>
                              <p className="text-xs text-gray-500 font-medium">Standard international version</p>
                           </div>
                        </div>
                        {i18n.language === 'en' && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                     </button>

                     <button
                        type="button"
                        onClick={() => i18n.changeLanguage('ar')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                          i18n.language === 'ar' ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200"
                        )}
                     >
                        <div className="flex items-center gap-3 text-end" dir="rtl">
                           <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-blue-600">AR</div>
                           <div>
                              <p className="font-bold text-gray-900">العربية</p>
                              <p className="text-xs text-gray-500 font-medium">النسخة العربية الكاملة</p>
                           </div>
                        </div>
                        {i18n.language === 'ar' && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                     </button>

                     <button
                        type="button"
                        onClick={() => i18n.changeLanguage('bn')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                          i18n.language === 'bn' ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200"
                        )}
                     >
                        <div className="flex items-center gap-3 text-start">
                           <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-blue-600">BN</div>
                           <div>
                              <p className="font-bold text-gray-900">বাংলা</p>
                              <p className="text-xs text-gray-500 font-medium">পূর্ণাঙ্গ বাংলা সংস্করণ</p>
                           </div>
                        </div>
                        {i18n.language === 'bn' && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {t('save_changes')}
          </button>
        </div>
      </form>

      {/* Logo Cropper Modal */}
      <AnimatePresence>
        {croppingImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('adjust_logo')}</h3>
                <button 
                  onClick={() => setCroppingImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              
              <div className="relative h-[400px] w-full bg-gray-900">
                <Cropper
                  image={croppingImage}
                  crop={crop}
                  zoom={zoom}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              <div className="p-8 space-y-6 bg-white">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold text-gray-500 uppercase tracking-widest">
                    <span>{t('zoom')}</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCroppingImage(null)}
                    className="flex-1 py-4 px-6 rounded-2xl border-2 border-gray-100 font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={uploadCroppedImage}
                    disabled={loading}
                    className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {t('apply_save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="p-8 bg-orange-50 rounded-3xl border border-orange-100 space-y-4">
        <h4 className="flex items-center gap-2 text-orange-800 font-black">
          <AlertCircle className="h-5 w-5" />
          System Information
        </h4>
        <p className="text-orange-700/80 text-sm font-medium leading-relaxed">
          Changing the <b>Starting Number</b> will only affect future invoices. Previous invoice numbers remain unchanged to maintain auditing integrity. Logo changes are reflected instantly on all download links.
        </p>
      </div>
    </div>
  );
}
