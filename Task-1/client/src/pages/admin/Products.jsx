import React, { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { POP, T_EXIT, T_STATE } from '../../lib/motion';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useToast } from '../../components/Toast';
import { ErrorState, Field, Pagination, Spinner } from '../../components/ui';
import api, { errorMessage, fieldErrors } from '../../lib/axios';
import { useDebounce } from '../../hooks';
import { CATEGORIES, formatINR, onImgError } from '../../lib/format';

const PAGE_SIZE = 10;
const emptyForm = { name: '', description: '', price: '', stock: '', category: 'Electronics', brand: '', image: '' };

const validate = (f) => {
  const errors = {};
  if (f.name.trim().length < 2) errors.name = 'Enter a product name';
  if (!(Number(f.price) >= 1)) errors.price = 'Enter a price of ₹1 or more';
  if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) errors.stock = 'Enter a whole number, 0 or more';
  if (f.image && !/^https?:\/\/\S+$/i.test(f.image.trim())) errors.image = 'Enter a full http(s) image URL';
  return errors;
};

function ProductModal({ product, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(
    product
      ? { name: product.name, description: product.description || '', price: product.price, stock: product.stock, category: product.category, brand: product.brand || '', image: product.images?.[0] || '' }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const cls = (key) => `input ${errors[key] ? 'input-error' : ''}`;

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    // Keep any extra gallery images the product already has.
    const images = form.image.trim() ? [form.image.trim(), ...(product?.images || []).slice(1)] : [];
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      brand: form.brand.trim() || 'Generic',
      images,
    };

    setSaving(true);
    try {
      if (product) await api.put(`/products/${product._id}`, body);
      else await api.post('/products', body);
      showToast(product ? 'Product updated' : 'Product added', 'success');
      onSaved();
    } catch (err) {
      const fields = fieldErrors(err);
      if (fields.images) fields.image = fields.images;
      setErrors(fields);
      showToast(errorMessage(err, 'Could not save the product'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: T_STATE }} exit={{ opacity: 0, transition: T_EXIT }}
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={product ? 'Edit product' : 'Add product'}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <m.form onSubmit={submit} noValidate
        {...POP}
        className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-midnight">{product ? 'Edit product' : 'Add product'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-smoke hover:text-midnight"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" error={errors.name} className="col-span-2"><input className={cls('name')} value={form.name} onChange={set('name')} autoFocus /></Field>
          <Field label="Description" error={errors.description} className="col-span-2">
            <textarea className={`${cls('description')} resize-none`} rows={3} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Price (₹)" error={errors.price}><input type="number" min="1" className={cls('price')} value={form.price} onChange={set('price')} /></Field>
          <Field label="Stock" error={errors.stock}><input type="number" min="0" step="1" className={cls('stock')} value={form.stock} onChange={set('stock')} /></Field>
          <Field label="Category" error={errors.category}>
            <select className={cls('category')} value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Brand" error={errors.brand}><input className={cls('brand')} value={form.brand} onChange={set('brand')} placeholder="Generic" /></Field>
          <Field label="Image URL" error={errors.image} className="col-span-2">
            <div className="flex gap-3 items-center">
              <input className={cls('image')} value={form.image} onChange={set('image')} placeholder="https://…" />
              {form.image && <img src={form.image} alt="Preview" onError={onImgError} className="w-11 h-11 rounded-lg object-contain bg-warmIvory border border-parchment shrink-0" />}
            </div>
          </Field>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving && <Spinner className="w-4 h-4" />} Save product</button>
        </div>
      </m.form>
    </m.div>
  );
}

export default function AdminProducts() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim());
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | product
  const [reload, setReload] = useState(0);

  useEffect(() => setPage(1), [q, category]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/products', { params: { q: q || undefined, category: category || undefined, page, limit: PAGE_SIZE, sort: 'newest' }, signal: controller.signal })
      .then(({ data }) => {
        setResult(data);
        setLoading(false);
        if (page > data.pages) setPage(data.pages); // e.g. after deleting the last row of the last page
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [q, category, page, reload]);

  const refresh = () => setReload((n) => n + 1);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? Its reviews will be removed too.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      showToast('Product deleted', 'success');
      refresh();
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <AdminLayout title="Products" subtitle={`${result.total} product${result.total === 1 ? '' : 's'}`}
      actions={<button onClick={() => setModal('new')} className="btn-primary"><Plus className="w-4 h-4" /> Add product</button>}>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="search" className="input pl-10" placeholder="Search by name or brand" aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input !w-auto" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error ? <ErrorState message={error} onRetry={refresh} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>{['Product', 'Category', 'Price', 'Stock', 'Rating', ''].map((h) => <th key={h} className="table-head">{h}</th>)}</tr>
              </thead>
              <tbody className={`divide-y divide-parchment ${loading ? 'opacity-50' : ''}`}>
                {loading && !result.products.length
                  ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="table-cell"><div className="h-10 skeleton" /></td></tr>)
                  : result.products.map((p) => (
                    <tr key={p._id} className="hover:bg-warmIvory/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-3 min-w-[14rem]">
                          <img src={p.images?.[0] || ''} alt="" onError={onImgError} className="w-11 h-11 rounded-lg object-contain bg-warmIvory p-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-midnight line-clamp-1">{p.name}</p>
                            <p className="text-smoke text-xs">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell"><span className="badge-gray">{p.category}</span></td>
                      <td className="table-cell font-semibold text-midnight whitespace-nowrap">{formatINR(p.price)}</td>
                      <td className="table-cell">
                        <span className={p.stock === 0 ? 'badge-danger' : p.stock < 10 ? 'badge-warning' : 'text-bodyInk font-medium'}>{p.stock}</span>
                      </td>
                      <td className="table-cell text-smoke whitespace-nowrap">{p.rating?.count ? `${p.rating.average.toFixed(1)} (${p.rating.count})` : '—'}</td>
                      <td className="table-cell">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setModal(p)} aria-label={`Edit ${p.name}`} className="p-2 text-smoke hover:text-midnight hover:bg-parchment/50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p)} aria-label={`Delete ${p.name}`} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && !result.products.length && (
                  <tr><td colSpan={6} className="table-cell text-center text-smoke py-10">No products match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={page} pages={result.pages} onChange={setPage} />

      <AnimatePresence>
        {modal && (
          <ProductModal key="product-modal" product={modal === 'new' ? null : modal} onClose={() => setModal(null)}
            onSaved={() => { setModal(null); refresh(); }} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
