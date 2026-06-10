import React, { useEffect, useState } from 'react';
import { AdminNav } from './Dashboard';
import { useToast } from '../../components/Toast';
import api from '../../lib/axios';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
const emptyForm = { name: '', description: '', price: '', stock: '', category: 'Electronics', brand: '', images: [''] };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { showToast } = useToast();

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products?limit=100').then(({ data }) => setProducts(data.products)).finally(() => setLoading(false));
  };
  useEffect(fetchProducts, []);

  const openAdd = () => { setEditProduct(null); setFormData(emptyForm); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setFormData({ ...p, images: p.images || [''] }); setShowModal(true); };
  const setF = (k) => (e) => setFormData((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    try {
      const body = { ...formData, price: Number(formData.price), stock: Number(formData.stock) };
      if (editProduct) { await api.put(`/products/${editProduct._id}`, body); showToast('Product updated ✓', 'success'); }
      else { await api.post('/products', body); showToast('Product added ✓', 'success'); }
      setShowModal(false); fetchProducts();
    } catch (err) { showToast(err.response?.data?.message || 'Error saving', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); showToast('Deleted ✓', 'success'); fetchProducts(); }
    catch { showToast('Error deleting', 'error'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-midnight">Products</h1>
          <p className="text-smoke text-sm mt-0.5">{products.length} products total</p>
        </div>
        <button onClick={openAdd} className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center px-5 py-2.5 text-sm">
          + Add Product
        </button>
      </div>

      <div className="bg-pureWhite border border-parchment rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-parchment bg-warmIvory">
                {['#', 'Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-smoke">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-10 skeleton rounded-xl" /></td></tr>
                ))
                : products.map((p, i) => (
                  <tr key={p._id} className="hover:bg-warmIvory transition-colors">
                    <td className="px-4 py-3 text-smoke text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <img src={p.images?.[0]} alt={p.name}
                        className="w-12 h-12 object-cover rounded-xl bg-warmIvory"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=48&background=27272a&color=a78bfa`; }} />
                    </td>
                    <td className="px-4 py-3 font-medium text-midnight max-w-[200px]">
                      <p className="line-clamp-1">{p.name}</p>
                      <p className="text-smoke text-xs">{p.brand}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-gray text-[10px]">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-vividGold font-extrabold">₹{p.price.toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 font-semibold text-sm ${p.stock < 10 ? 'text-red-400' : 'text-midnight'}`}>{p.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-vividGold hover:text-vividGold hover:bg-violet-500/10 rounded-lg transition">✏️</button>
                        <button onClick={() => handleDelete(p._id)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-pureWhite border border-parchment rounded-2xl p-7 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-midnight">{editProduct ? '✏️ Edit Product' : '+ Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-smoke hover:text-midnight text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full col-span-2" placeholder="Product Name" value={formData.name} onChange={setF('name')} />
              <textarea className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full col-span-2 resize-none" placeholder="Description" rows={3} value={formData.description} onChange={setF('description')} />
              <input className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full" type="number" placeholder="Price ₹" value={formData.price} onChange={setF('price')} />
              <input className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full" type="number" placeholder="Stock" value={formData.stock} onChange={setF('stock')} />
              <select className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full bg-warmIvory" value={formData.category} onChange={setF('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full" placeholder="Brand" value={formData.brand} onChange={setF('brand')} />
              <input className="bg-pureWhite border border-parchment text-bodyInk rounded-xl px-4 py-2.5 outline-none focus:border-vividGold focus:ring-1 focus:ring-vividGold w-full col-span-2" placeholder="Image URL" value={formData.images?.[0] || ''}
                onChange={(e) => setFormData((f) => ({ ...f, images: [e.target.value] }))} />
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-ghost px-6 py-2.5 text-sm border border-parchment">Cancel</button>
              <button onClick={handleSave} className="bg-vividGold text-midnight font-semibold rounded-full px-5 py-2 hover:opacity-90 transition text-center inline-flex items-center justify-center px-8 py-2.5 text-sm">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
