import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Calculator,
  User,
  Calendar,
  ChevronDown,
  Printer,
  X,
  FileDown,
  Clock
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePlanLimits } from '../../hooks/usePlanLimits';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Crown, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Customer {
  id: string;
  name_en: string;
  name_ar: string;
}

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  unit_price: number;
  description_en: string;
}

interface InvoiceItem {
  id?: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function InvoiceForm() {
  const { profile, company } = useAuthStore();
  const { limits, loading: limitsLoading } = usePlanLimits();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Invoice State
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_id: null, description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);
  
  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  // Initialize due date (7 days default)
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    
    const [custRes, prodRes] = await Promise.all([
      supabase.from('customers').select('id, name_en, name_ar').eq('company_id', profile.company_id),
      supabase.from('products').select('*').eq('company_id', profile.company_id)
    ]);

    if (custRes.data) setCustomers(custRes.data);
    if (prodRes.data) setProducts(prodRes.data);

    if (id) {
      setLoading(true);
      const { data: inv, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .single();
      
      if (inv && !error) {
        setCustomerId(inv.customer_id);
        setIssueDate(inv.issue_date);
        setDueDate(inv.due_date);
        setNotes(inv.notes || '');
        setItems(inv.invoice_items.map((it: any) => ({
          product_id: it.product_id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount
        })));
      }
      setLoading(false);
    }
  }, [profile?.company_id, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recalculate totals
  useEffect(() => {
    const s = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    const taxRate = company?.tax_rate || 15;
    const isInclusive = company?.settings?.tax_type === 'inclusive';
    
    let sub, tax, tot;
    
    if (isInclusive) {
      tot = s;
      sub = tot / (1 + taxRate / 100);
      tax = tot - sub;
    } else {
      sub = s;
      tax = (sub * taxRate) / 100;
      tot = sub + tax;
    }

    setSubtotal(sub);
    setTaxAmount(tax);
    setTotal(tot);
  }, [items, company?.tax_rate, company?.settings?.tax_type]);

  const addItem = () => {
    setItems([...items, { product_id: null, description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    // If product selection changes, update price and description
    if (field === 'product_id' && value) {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.unit_price = prod.unit_price;
        item.description = i18n.language === 'ar' ? (prod.name_ar || prod.name_en) : prod.name_en;
      }
    }
    
    item.amount = (item.quantity || 0) * (item.unit_price || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSave = async (status: 'draft' | 'unpaid' = 'unpaid') => {
    if (!profile?.company_id) {
      toast.error("Error: Company profile not found. Please try logging out and back in.");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer.");
      return;
    }
    if (items.length === 0 || (items.length === 1 && !items[0].description)) {
      toast.error("Please add at least one line item with a description.");
      return;
    }
    setLoading(true);
    const label = status === 'draft' ? 'Saving draft...' : (id ? 'Updating invoice...' : 'Creating invoice...');
    const toastId = toast.loading(label);
 
    const invoicePayload = {
      company_id: profile.company_id,
      customer_id: customerId,
      issue_date: issueDate,
      due_date: dueDate,
      notes,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      currency: company?.default_currency || 'USD',
      status: status
    };
 
    try {
      let savedId = id;

      if (id) {
        // Update existing
        const { error } = await supabase.from('invoices').update(invoicePayload).eq('id', id);
        if (error) throw error;
        
        // Simple strategy: delete and re-insert items
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        const { error: itemsErr } = await supabase.from('invoice_items').insert(
          items.map(item => ({ 
            product_id: item.product_id,
            description: item.description || '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            company_id: profile.company_id,
            invoice_id: id 
          }))
        );
        if (itemsErr) throw itemsErr;
        toast.success(status === 'draft' ? 'Draft updated!' : 'Invoice updated!', { id: toastId });
      } else {
        // Create new
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .insert(invoicePayload)
          .select()
          .single();
        
        if (invErr) throw invErr;
        savedId = inv.id;
 
        const { error: itemsErr } = await supabase.from('invoice_items').insert(
          items.map(item => ({ 
            product_id: item.product_id,
            description: item.description || '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            company_id: profile.company_id,
            invoice_id: inv.id 
          }))
        );
        if (itemsErr) throw itemsErr;
 
        // Add notification
        await supabase.from('notifications').insert({
          company_id: profile?.company_id,
          title_en: 'New Invoice Created',
          message_en: `Invoice #${inv.invoice_number} for ${customers.find(c => c.id === customerId)?.name_en} created successfully.`,
          type: 'system'
        });
        toast.success(status === 'draft' ? 'Draft saved!' : 'Invoice created!', { id: toastId });
      }

      setLastSavedId(savedId || null);
      if (status === 'unpaid') {
        // Only navigate away if it's a final save, or wait for print
        // navigate('/invoices');
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <AnimatePresence>
        {!id && !limitsLoading && !limits.canCreateInvoice && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="text-start">
                <h3 className="text-lg font-black text-red-900 leading-tight">Monthly invoice limit reached!</h3>
                <p className="text-red-800/70 font-medium">Your current {limits.planName} plan only allows {limits.maxInvoices} invoices per month.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100"
            >
              <Crown className="h-5 w-5" />
              Upgrade to Pro
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium border border-gray-200 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('back')}
          </button>

          {lastSavedId && (
            <Link
              to={`/invoices/${lastSavedId}`}
              className="flex items-center gap-2 px-6 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-bold border border-green-200 animate-in fade-in slide-in-from-left-4"
            >
              <Printer className="h-5 w-5" />
              {t('print_invoice', 'Print Invoice')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!id && (
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-bold disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
              {t('save_as_draft', 'Save as Draft')}
            </button>
          )}
          
          <button
            onClick={() => handleSave('unpaid')}
            disabled={loading || (!id && !limits.canCreateInvoice)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-bold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {t('save')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-10">
        {/* Header Logic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                <User className="h-4 w-4 text-blue-600" />
                {t('customers')}
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none appearance-none transition-all cursor-pointer font-medium"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">{t('select_customer')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {i18n.language === 'ar' ? (c.name_ar || c.name_en) : c.name_en}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-purple-600" />
                {t('issue_date')}
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                <Clock className="h-4 w-4 text-orange-600" />
                {t('due_date')}
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all font-medium"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Items */}
        <div className="space-y-4">
          <div className="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-start text-xs font-black text-gray-500 uppercase tracking-widest w-1/3">{t('item')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-gray-500 uppercase tracking-widest w-24">{t('qty')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-gray-500 uppercase tracking-widest">{t('unit_price')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-gray-500 uppercase tracking-widest">{t('amount')}</th>
                  <th className="px-6 py-4 text-end w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="px-6 py-4">
                      <div className="space-y-2 text-start">
                        <select
                          className="w-full px-3 py-2 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-600 focus:ring-0 outline-none transition-colors font-semibold"
                          value={item.product_id || ''}
                          onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                        >
                          <option value="">Choose a product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                               {i18n.language === 'ar' ? (p.name_ar || p.name_en) : p.name_en}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="w-full text-xs text-gray-500 bg-transparent border-none focus:ring-0 italic"
                          placeholder="Line item description..."
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <input
                         type="number"
                         min="1"
                         className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold"
                         value={item.quantity}
                         onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                       />
                    </td>
                    <td className="px-6 py-4">
                        <input
                         type="number"
                         step="0.01"
                         className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                         value={item.unit_price}
                         onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                       />
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-black text-gray-900 block pt-2">
                         {item.amount.toFixed(2)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                       <button 
                        onClick={() => removeItem(idx)}
                        className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                      >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            {t('add_item')}
          </button>
        </div>

        {/* Notes & Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 border-t border-gray-100">
           <div className="space-y-4 text-start">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('notes')}</label>
              <textarea
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-3xl min-h-[150px] outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                placeholder="Message displayed on invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
           </div>

           <div className="bg-gray-50 rounded-3xl p-8 space-y-4">
              <div className="flex justify-between items-center text-gray-500 font-medium">
                 <span>{t('subtotal')}</span>
                 <span>{company?.default_currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 font-medium pb-4 border-b border-gray-200">
                 <span>{t('tax')} ({company?.tax_rate || 15}%) {company?.settings?.tax_type === 'inclusive' && `(${t('inclusive')})`}</span>
                 <span>{company?.default_currency} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-600 rounded-lg">
                      <Calculator className="h-5 w-5 text-white" />
                   </div>
                   <span className="text-xl font-black text-gray-900">{t('total')}</span>
                 </div>
                 <span className="text-3xl font-black text-blue-600">
                    {company?.default_currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
