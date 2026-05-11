import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Mail, Phone, MapPin, Edit2, Trash2, Loader2, User as UserIcon, Users, FileDown, Upload, DollarSign } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { downloadTemplate, parseExcelFile } from '../../lib/excelUtils';

interface Customer {
  id: string;
  name_en: string;
  name_ar: string;
  email: string;
  phone: string;
  address: string;
  address_ar: string;
  tax_number: string;
  salesman: string;
  opening_balance: number;
}

export default function Customers() {
  const { profile } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    phone: '',
    address: '',
    address_ar: '',
    tax_number: '',
    salesman: '',
    opening_balance: 0,
  });

  const [importing, setImporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    let query = supabase
      .from('customers')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setCustomers(data);
    }
    setLoading(false);
  }, [profile?.company_id, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name_en: customer.name_en,
        name_ar: customer.name_ar,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        address_ar: customer.address_ar || '',
        tax_number: customer.tax_number || '',
        salesman: customer.salesman || '',
        opening_balance: customer.opening_balance || 0,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name_en: '',
        name_ar: '',
        email: '',
        phone: '',
        address: '',
        address_ar: '',
        tax_number: '',
        salesman: '',
        opening_balance: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit validation check
    if (!formData.name_en.trim()) {
      toast.error("Please enter at least the English Name.");
      return;
    }
 
    if (!profile?.company_id) {
      console.error('Missing company_id', profile);
      toast.error("Error: Company profile not found. Please try logging out and back in.");
      return;
    }
    
    setFormLoading(true);
    const toastId = toast.loading(editingCustomer ? 'Updating customer...' : 'Creating customer...');
 
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication failed. Please login again.");

      const payload = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        address_ar: formData.address_ar.trim() || null,
        tax_number: formData.tax_number.trim() || null,
        salesman: formData.salesman.trim() || null,
        opening_balance: Number(formData.opening_balance) || 0,
        company_id: profile.company_id,
      };
 
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id);
        
        if (error) throw error;
        toast.success('Customer updated successfully', { id: toastId });
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Customer created successfully', { id: toastId });
      }
      
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      toast.error(err.message || "Error saving customer", { id: toastId });
    } finally {
      setFormLoading(false);
    }
  };
 
  const handleDelete = async (id: string) => {
     if (confirm('Are you sure you want to delete this customer?')) {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) {
          toast.error('Failed to delete customer: ' + error.message);
        } else {
          toast.success('Customer deleted');
          fetchCustomers();
        }
     }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.company_id) return;

    setImporting(true);
    const toastId = toast.loading('Importing customers...');
    try {
      const data = await parseExcelFile(file);
      const customersToInsert = data.map((row: any) => ({
        company_id: profile.company_id,
        name_en: String(row['Name (English)'] || '').trim(),
        name_ar: String(row['Name (Arabic)'] || '').trim() || null,
        email: String(row['Email'] || '').trim() || null,
        phone: String(row['Phone'] || '').trim() || null,
        address: String(row['Address (English)'] || '').trim() || null,
        address_ar: String(row['Address (Arabic)'] || '').trim() || null,
        tax_number: String(row['Tax Number'] || '').trim() || null,
        salesman: String(row['Salesman'] || '').trim() || null,
        opening_balance: Number(row['Opening Balance']) || 0,
      })).filter(c => c.name_en);

      if (customersToInsert.length === 0) {
        throw new Error('No valid customers found in the Excel file.');
      }

      const { error } = await supabase.from('customers').insert(customersToInsert);
      if (error) throw error;

      toast.success(`${customersToInsert.length} customers imported successfully`, { id: toastId });
      fetchCustomers();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Failed to import customers', { id: toastId });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('customers')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('customer_list')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => downloadTemplate('customers')}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            title="Download Excel Template"
          >
            <FileDown className="h-5 w-5" />
            {t('template', 'Template')}
          </button>
          
          <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-all cursor-pointer font-semibold shadow-sm">
            {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {importing ? t('importing', 'Importing...') : t('import_excel', 'Import Excel')}
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleImportExcel}
              disabled={importing}
            />
          </label>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold"
          >
            <Plus className="h-5 w-5" />
            {t('add_customer')}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pr-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t('search')}
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent sm:text-sm transition-all rtl:pl-3 rtl:pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse space-y-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">{t('no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <motion.div
              layout
              key={customer.id}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 rtl:right-auto rtl:left-0">
                <button
                  onClick={() => handleOpenModal(customer)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {i18n.language === 'ar' ? (customer.name_ar || customer.name_en) : customer.name_en}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {customer.email || 'No email'}
                      </p>
                      {customer.tax_number && (
                        <p className="text-[10px] text-blue-500 font-bold mt-0.5">
                          VAT: {customer.tax_number}
                        </p>
                      )}
                      {customer.salesman && (
                        <p className="text-[10px] text-purple-500 font-bold mt-0.5">
                          SALES: {customer.salesman}
                        </p>
                      )}
                    </div>
                  </div>
                  {customer.opening_balance > 0 && (
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{t('opening_balance', 'Opening Balance')}</p>
                      <p className="text-sm font-bold text-blue-600">{customer.opening_balance.toFixed(2)}</p>
                    </div>
                  )}
                </div>

              <div className="space-y-2 text-sm text-gray-600">
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {(customer.address || customer.address_ar) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 italic">
                      {i18n.language === 'ar' ? (customer.address_ar || customer.address) : customer.address}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? t('edit_customer') : t('add_customer')}
      >
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">{t('name_en')}</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    value={formData.name_en}
                    onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                    placeholder="John Doe"
                  />
               </div>
               <div className="space-y-1" dir="rtl">
                  <label className="text-sm font-semibold text-gray-700">{t('name_ar')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-right"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                    placeholder="جون دو"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">{t('email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all rtl:pr-10 rtl:pl-3"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">{t('phone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all rtl:pr-10 rtl:pl-3"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+966..."
                    />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">{t('tax_number')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                    placeholder="VAT-123456"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">{t('salesman')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                    value={formData.salesman}
                    onChange={(e) => setFormData({...formData, salesman: e.target.value})}
                    placeholder="e.g. Mike Sales"
                  />
               </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t('opening_balance', 'Opening Balance')}</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                   <input
                     type="number"
                     step="0.01"
                     className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all rtl:pr-10 rtl:pl-3"
                     value={formData.opening_balance}
                     onChange={(e) => setFormData({...formData, opening_balance: parseFloat(e.target.value) || 0})}
                     placeholder="0.00"
                   />
                </div>
             </div>

            <div className="space-y-1">
               <label className="text-sm font-semibold text-gray-700">{t('address')}</label>
               <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
               />
            </div>

            <div className="space-y-1" dir="rtl">
               <label className="text-sm font-semibold text-gray-700 text-left w-full block">{t('address_ar')}</label>
               <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-right"
                  rows={2}
                  value={formData.address_ar}
                  onChange={(e) => setFormData({...formData, address_ar: e.target.value})}
               />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold disabled:opacity-70 flex items-center justify-center"
            >
              {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
