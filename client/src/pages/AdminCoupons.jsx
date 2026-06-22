import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';

const empty = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  maxDiscountAmount: '', minOrderAmount: '', usageLimit: '', usageLimitPerUser: 1,
  validFrom: '', validUntil: ''
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/admin/all');
      setCoupons(data.coupons || []);
    } catch {
      setError('Failed to load coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue ?? '',
      maxDiscountAmount: coupon.maxDiscountAmount ?? '',
      minOrderAmount: coupon.minOrderAmount ?? '',
      usageLimit: coupon.usageLimit ?? '',
      usageLimitPerUser: coupon.usageLimitPerUser ?? 1,
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : ''
    });
    setEditId(coupon._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount !== '' ? Number(form.maxDiscountAmount) : undefined,
      minOrderAmount: form.minOrderAmount !== '' ? Number(form.minOrderAmount) : 0,
      usageLimit: form.usageLimit !== '' ? Number(form.usageLimit) : undefined,
      usageLimitPerUser: Number(form.usageLimitPerUser),
    };
    try {
      if (editId) {
        await api.put(`/coupons/${editId}`, payload);
      } else {
        await api.post('/coupons', payload);
      }
      await fetchCoupons();
      setShowForm(false);
      setEditId(null);
      setForm(empty);
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const { data } = await api.put(`/coupons/${coupon._id}`, { isActive: !coupon.isActive });
      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? data.coupon : c)));
    } catch {
      alert('Update failed.');
    }
  };

  const inp = 'w-full border border-sand-dark rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold';

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Coupons</h1>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }}>+ New Coupon</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            className="bg-paper rounded-sm border border-sand-dark p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h2 className="font-display text-xl text-ink mb-5">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-ink/50 mb-1 block">Code *</label>
                <input className={inp} required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-ink/50 mb-1 block">Description</label>
                <input className={inp} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Discount Type *</label>
                <select className={inp} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Discount Value *</label>
                <input className={inp} type="number" min="0" step="0.01" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="20" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Max Discount (Rs.)</label>
                <input className={inp} type="number" min="0" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Min Order (Rs.)</label>
                <input className={inp} type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Total Usage Limit</label>
                <input className={inp} type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Per-User Limit</label>
                <input className={inp} type="number" min="1" value={form.usageLimitPerUser} onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Valid From</label>
                <input className={inp} type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Valid Until</label>
                <input className={inp} type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button type="submit" loading={saving}>Save</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/60 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : coupons.length === 0 ? (
        <p className="text-sm text-ink/50">No coupons yet. Create one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-dark text-left">
                <th className="pb-3 text-xs uppercase tracking-wider text-ink/40 font-normal">Code</th>
                <th className="pb-3 text-xs uppercase tracking-wider text-ink/40 font-normal">Discount</th>
                <th className="pb-3 text-xs uppercase tracking-wider text-ink/40 font-normal hidden sm:table-cell">Min Order</th>
                <th className="pb-3 text-xs uppercase tracking-wider text-ink/40 font-normal hidden md:table-cell">Valid Until</th>
                <th className="pb-3 text-xs uppercase tracking-wider text-ink/40 font-normal">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-sand/50 hover:bg-sand/20 transition-colors">
                  <td className="py-3 font-mono text-ink font-medium">{c.code}</td>
                  <td className="py-3 text-ink/70">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `Rs. ${c.discountValue}`}
                  </td>
                  <td className="py-3 text-ink/50 hidden sm:table-cell">Rs. {(c.minOrderAmount || 0).toLocaleString()}</td>
                  <td className="py-3 text-ink/50 hidden md:table-cell">
                    {c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-PK') : '—'}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(c)} className="text-xs text-ink/50 hover:text-gold transition-colors">Edit</button>
                      <button onClick={() => handleDelete(c._id)} className="text-xs text-ink/50 hover:text-error transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
