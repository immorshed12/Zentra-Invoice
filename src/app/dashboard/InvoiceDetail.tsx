import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  Loader2,
  Mail,
  MessageSquare,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from '../../components/invoice/InvoicePDF';
import { cn } from '../../lib/utils';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, company } = useAuthStore();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    if (!id || !profile?.company_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customer_id(*), invoice_items(*)')
      .eq('id', id)
      .single();
    
    if (data && !error) setInvoice(data);
    setLoading(false);
  }, [id, profile?.company_id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDelete = async () => {
    if (confirm('Delete this invoice?')) {
      await supabase.from('invoices').delete().eq('id', id);
      navigate('/invoices');
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center text-start">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  if (!invoice) return (
    <div className="flex flex-col items-center justify-center py-20 text-start">
       <p className="text-gray-500 font-bold">Inavlid Invoice ID</p>
       <button onClick={() => navigate('/invoices')} className="mt-4 text-blue-600 font-bold underline">Go back</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-start">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-20 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">
              Invoice #{invoice.invoice_number}
            </h1>
            <span className="text-xs text-gray-500 font-medium mt-1 block">
              Issued on {new Date(invoice.issue_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 shrink-0">
             <Printer className="h-4 w-4" />
             {t('print', 'Print')}
          </button>
          
          {company && (
            <PDFDownloadLink 
              document={<InvoicePDF invoice={invoice} company={company} />}
              fileName={`${invoice.invoice_number}.pdf`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition-all shrink-0"
            >
              {({ loading: pdfLoading }) => (
                <>
                  {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {t('download_pdf')}
                </>
              )}
            </PDFDownloadLink>
          )}

          <button 
            onClick={() => navigate(`/invoices/edit/${invoice.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 shrink-0 transition-all"
          >
            <Edit className="h-4 w-4" />
            {t('edit')}
          </button>
          
          <button 
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-xl shrink-0 transition-all"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Body */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
           <div className="p-8 md:p-12 space-y-12">
              {/* Header */}
              <div className="flex justify-between items-start">
                  <div className="space-y-4">
                     {company?.logo_url ? (
                       <div className="h-16 w-32 bg-white rounded-2xl flex items-center justify-start overflow-hidden">
                          <img src={company.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                       </div>
                     ) : (
                       <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                          <FileText className="text-white h-8 w-8" />
                       </div>
                     )}
                     <h2 className="text-4xl font-black text-gray-900 tracking-tight">INVOICE</h2>
                  </div>
                  <div className="text-end">
                     <h3 className="text-xl font-bold text-blue-600">{company?.name_en}</h3>
                     {company?.name_ar && <p className="text-sm text-gray-400 mt-1">{company.name_ar}</p>}
                     <p className="text-sm text-gray-500 mt-2 max-w-[200px] leading-relaxed">
                        {company?.address}
                     </p>
                  </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-12 py-10 border-y border-gray-100">
                  <div className="space-y-3 text-start">
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Bill To</p>
                      <div>
                         <h4 className="text-lg font-bold text-gray-900">{invoice.customer.name_en}</h4>
                         {invoice.customer.name_ar && <p className="text-sm text-gray-400 font-medium">{invoice.customer.name_ar}</p>}
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                         <p>{invoice.customer.email}</p>
                         <p>{invoice.customer.phone}</p>
                         {invoice.customer.address && <p>{invoice.customer.address}</p>}
                         {invoice.customer.address_ar && <p className="text-end" dir="rtl">{invoice.customer.address_ar}</p>}
                      </div>
                  </div>
                  <div className="space-y-3 text-end">
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Details</p>
                      <div className="space-y-2 font-medium">
                         <div className="flex justify-end gap-4 text-sm">
                            <span className="text-gray-400">Number:</span>
                            <span className="text-gray-900">#{invoice.invoice_number}</span>
                         </div>
                         <div className="flex justify-end gap-4 text-sm">
                            <span className="text-gray-400">Issue Date:</span>
                            <span className="text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                         </div>
                         <div className="flex justify-end gap-4 text-sm">
                            <span className="text-gray-400">Due Date:</span>
                            <span className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</span>
                         </div>
                      </div>
                  </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                  <table className="w-full text-start">
                      <thead>
                         <tr className="bg-gray-50/50">
                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest rounded-l-xl text-start">Description</th>
                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-end">Unit Price</th>
                            <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-end rounded-r-xl">Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {invoice.invoice_items?.map((item: any) => (
                           <tr key={item.id}>
                              <td className="px-4 py-6">
                                 <p className="font-bold text-gray-900">{item.description}</p>
                              </td>
                              <td className="px-4 py-6 text-center font-medium text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-6 text-end font-medium text-gray-600">{item.unit_price.toLocaleString()}</td>
                              <td className="px-4 py-6 text-end font-black text-gray-900">{item.amount.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                  </table>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                  <div className="w-full max-w-[300px] space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex justify-between items-center text-sm">
                         <span className="text-gray-500 font-medium">Subtotal</span>
                         <span className="font-bold text-gray-900">{invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pb-4 border-b border-gray-200">
                         <span className="text-gray-500 font-medium">Tax ({company?.tax_rate}%) {company?.settings?.tax_type === 'inclusive' && '(Included)'}</span>
                         <span className="font-bold text-gray-900">{invoice.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                         <span className="text-lg font-black text-gray-900">Total</span>
                         <span className="text-2xl font-black text-blue-600">{invoice.currency || company?.default_currency} {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                  </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 border-dashed">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">Notes</p>
                    <p className="text-sm text-blue-700 font-medium leading-relaxed italic">{invoice.notes}</p>
                </div>
              )}
           </div>
        </div>

        {/* Status & Sidebar Tools */}
        <div className="space-y-6 text-start">
           <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Payment Status</h3>
              <div className={cn(
                "w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3",
                invoice.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
              )}>
                 {invoice.status === 'paid' ? <CheckCircle className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
                 <span className="text-2xl font-black uppercase tracking-tight">{invoice.status}</span>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                 <button 
                  onClick={async () => {
                    // This is a placeholder for actual Resend API integration
                    // In a real app, this would call an API route.
                    alert('Email sent to ' + invoice.customer.email);
                    await supabase.from('notifications').insert({
                      company_id: profile?.company_id,
                      title_en: 'Invoice Sent',
                      message_en: `Invoice #${invoice.invoice_number} sent to ${invoice.customer.name_en}`,
                      type: 'email'
                    });
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 text-gray-700 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                 >
                    <Mail className="h-5 w-5 text-blue-600" />
                    {t('send_invoice_email')}
                 </button>

                 <button 
                  onClick={() => {
                    const text = encodeURIComponent(`Hello ${invoice.customer.name_en}, your invoice #${invoice.invoice_number} from ${company?.name_en} is ready. Total: ${invoice.currency || company?.default_currency} ${invoice.total_amount.toLocaleString()}.`);
                    window.open(`https://wa.me/${invoice.customer.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-50 text-green-700 font-bold rounded-2xl hover:bg-green-100 transition-all"
                 >
                    <MessageSquare className="h-5 w-5" />
                    {t('share_whatsapp')}
                 </button>

                 <button 
                  onClick={async () => {
                    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id);
                    fetchInvoice();
                  }}
                  disabled={invoice.status === 'paid'}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-100"
                 >
                    Mark as Paid
                 </button>
              </div>
           </div>

           <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
              <h4 className="font-black text-lg mb-2">Zentra Pro</h4>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">Unlock advanced analytics, recurring invoices, and online payments.</p>
              <button className="w-full py-3 bg-white text-blue-600 font-black rounded-xl hover:bg-blue-50 transition-all text-sm uppercase tracking-wide">
                Upgrade Now
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
