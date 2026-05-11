import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  FileText, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  Loader2,
  Filter
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '../../components/invoice/InvoicePDF';
import { Download } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  currency: string;
  customer: {
    name_en: string;
    name_ar: string;
  };
}

const StatusBadge = ({ status, t }: { status: string; t: any }) => {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600 border-gray-200",
    unpaid: "bg-orange-50 text-orange-600 border-orange-100",
    paid: "bg-green-50 text-green-600 border-green-100",
    overdue: "bg-red-50 text-red-600 border-red-100",
    cancelled: "bg-gray-200 text-gray-500 border-gray-300",
  };

  const icons: Record<string, any> = {
    draft: Clock,
    unpaid: AlertCircle,
    paid: CheckCircle2,
    overdue: AlertCircle,
    cancelled: XCircle,
  };

  const Icon = icons[status] || Clock;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
      styles[status]
    )}>
      <Icon className="h-3.5 w-3.5" />
      {t(status)}
    </span>
  );
};

export default function InvoiceList() {
  const { profile, company } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInvoices = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customer:customer_id (
          name_en,
          name_ar,
          email,
          phone
        ),
        invoice_items (*)
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`invoice_number.ilike.%${searchTerm}%`);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setInvoices(data as any);
    }
    setLoading(false);
  }, [profile?.company_id, searchTerm, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this invoice?')) {
      await supabase.from('invoices').delete().eq('id', id);
      fetchInvoices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('invoices')}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your company billing</p>
        </div>
        <Link
          to="/invoices/new"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-semibold"
        >
          <Plus className="h-5 w-5" />
          {t('add_invoice')}
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            placeholder={t('search')}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all rtl:pr-10 rtl:pl-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-64">
           <Filter className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 rtl:right-3 rtl:left-auto" />
           <select
              className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none rtl:pr-10 rtl:pl-10 text-gray-700 font-medium cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
           >
              <option value="all">{t('all_statuses', 'All Statuses')}</option>
              <option value="draft">{t('draft', 'Draft')}</option>
              <option value="unpaid">{t('unpaid', 'Unpaid')}</option>
              <option value="paid">{t('paid', 'Paid')}</option>
              <option value="overdue">{t('overdue', 'Overdue')}</option>
              <option value="cancelled">{t('cancelled', 'Cancelled')}</option>
           </select>
           <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none rtl:left-0 rtl:right-auto">
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
           </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t('invoice_number')}</th>
                <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t('customers')}</th>
                <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t('issue_date')}</th>
                <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">{t('total')}</th>
                <th className="px-6 py-4 text-end text-xs font-bold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">{t('no_data')}</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-gray-900">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700">
                         {i18n.language === 'ar' ? (inv.customer?.name_ar || inv.customer?.name_en) : inv.customer?.name_en}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inv.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={inv.status} t={t} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-gray-900">
                        {inv.currency || company?.default_currency} {inv.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                       <div className="flex justify-end gap-2">
                        <button 
                           onClick={() => navigate(`/invoices/${inv.id}`)}
                           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button 
                           onClick={() => navigate(`/invoices/edit/${inv.id}`)}
                           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <FileEdit className="h-4 w-4" />
                        </button>
                        {(profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin') && (
                          <button 
                             onClick={() => handleDelete(inv.id)}
                             className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
