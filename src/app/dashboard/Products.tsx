import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Package, Edit2, Trash2, Loader2, DollarSign, FileDown, Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { downloadTemplate, parseExcelFile } from '../../lib/excelUtils';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  unit_price: number;
}

export default function Products() {
  const { profile } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    unit_price: 0,
  });

  const fetchProducts = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }, [profile?.company_id, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name_en: product.name_en,
        name_ar: product.name_ar,
        description_en: product.description_en || '',
        description_ar: product.description_ar || '',
        unit_price: product.unit_price,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        unit_price: 0,
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
    const toastId = toast.loading(editingProduct ? 'Updating product...' : 'Creating product...');
 
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication failed. Please login again.");

      const payload = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim() || null,
        description_en: formData.description_en.trim() || null,
        description_ar: formData.description_ar.trim() || null,
        unit_price: Number(formData.unit_price) || 0,
        company_id: profile.company_id,
      };
 
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        toast.success('Product updated successfully', { id: toastId });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Product created successfully', { id: toastId });
      }
      
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      toast.error(err.message || "Error saving product", { id: toastId });
    } finally {
      setFormLoading(false);
    }
  };
 
  const handleDelete = async (id: string) => {
     if (confirm('Are you sure you want to delete this product?')) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
           toast.error('Failed to delete product: ' + error.message);
        } else {
           toast.success('Product deleted');
           fetchProducts();
        }
     }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.company_id) return;

    setImporting(true);
    const toastId = toast.loading('Importing products...');
    try {
      const data = await parseExcelFile(file);
      const productsToInsert = data.map((row: any) => ({
        company_id: profile.company_id,
        name_en: String(row['Name (English)'] || '').trim(),
        name_ar: String(row['Name (Arabic)'] || '').trim() || null,
        description_en: String(row['Description (English)'] || '').trim() || null,
        description_ar: String(row['Description (Arabic)'] || '').trim() || null,
        unit_price: Number(row['Unit Price']) || 0,
      })).filter(c => c.name_en);

      if (productsToInsert.length === 0) {
        throw new Error('No valid products found in the Excel file.');
      }

      const { error } = await supabase.from('products').insert(productsToInsert);
      if (error) throw error;

      toast.success(`${productsToInsert.length} products imported successfully`, { id: toastId });
      fetchProducts();
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Failed to import products', { id: toastId });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('products')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('products_description', 'Manage your items and services')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => downloadTemplate('products')}
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
            {t('add_product')}
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

      <div className="overflow-hidden bg-white shadow-sm border border-gray-100 rounded-2xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('item')}
              </th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('description')}
              </th>
              <th className="px-6 py-4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('unit_price')}
              </th>
              <th className="px-6 py-4 text-end text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="px-6 py-8">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
               <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  {t('no_data')}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <Package className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-gray-900">
                        {i18n.language === 'ar' ? (product.name_ar || product.name_en) : product.name_en}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 line-clamp-1 italic">
                      {i18n.language === 'ar' ? (product.description_ar || product.description_en) : product.description_en}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                      {product.unit_price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-end">
                    <div className="flex justify-end gap-2">
                       <button
                        onClick={() => handleOpenModal(product)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? t('edit_product') : t('add_product')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">{t('name_en')}</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  value={formData.name_en}
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                />
             </div>
             <div className="space-y-1" dir="rtl">
                <label className="text-sm font-semibold text-gray-700">{t('name_ar')}</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-right"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-sm font-semibold text-gray-700">{t('unit_price')}</label>
             <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 rtl:right-3 rtl:left-auto" />
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all rtl:pr-10 rtl:pl-3"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-sm font-semibold text-gray-700">{t('description_en')}</label>
             <textarea
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
                rows={2}
                value={formData.description_en}
                onChange={(e) => setFormData({...formData, description_en: e.target.value})}
             />
          </div>

          <div className="space-y-1" dir="rtl">
             <label className="text-sm font-semibold text-gray-700">{t('description_ar')}</label>
             <textarea
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-right"
                rows={2}
                value={formData.description_ar}
                onChange={(e) => setFormData({...formData, description_ar: e.target.value})}
             />
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
