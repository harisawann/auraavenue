import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';

const empty = { question: '', answer: '', displayOrder: 0 };

export default function AdminFAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchFAQs = async () => {
    try {
      // fetch all including inactive for admin
      const { data } = await api.get('/faqs?includeInactive=true');
      setFaqs(data.faqs || []);
    } catch {
      setError('Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFAQs(); }, []);

  const handleEdit = (faq) => {
    setForm({ question: faq.question, answer: faq.answer, displayOrder: faq.displayOrder ?? 0 });
    setEditId(faq._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/faqs/${editId}`, form);
      } else {
        await api.post('/faqs', form);
      }
      await fetchFAQs();
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
    if (!confirm('Delete this FAQ?')) return;
    try {
      await api.delete(`/faqs/${id}`);
      setFaqs((prev) => prev.filter((f) => f._id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  const toggleActive = async (faq) => {
    try {
      const { data } = await api.put(`/faqs/${faq._id}`, { isActive: !faq.isActive });
      setFaqs((prev) => prev.map((f) => (f._id === faq._id ? data.faq : f)));
    } catch {
      alert('Update failed.');
    }
  };

  const inp = 'w-full border border-sand-dark rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold';

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">FAQs</h1>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }}>+ New FAQ</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            className="bg-paper rounded-sm border border-sand-dark p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h2 className="font-display text-xl text-ink mb-5">{editId ? 'Edit FAQ' : 'New FAQ'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Question *</label>
                <input className={inp} required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="What is your return policy?" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Answer *</label>
                <textarea className={`${inp} h-28 resize-y`} required value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="We accept returns within 7 days..." />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Display Order</label>
                <input className={inp} type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} />
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
      ) : faqs.length === 0 ? (
        <p className="text-sm text-ink/50">No FAQs yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {faqs.map((faq) => (
            <div key={faq._id} className="bg-white border border-sand-dark rounded-sm p-4 hover:border-gold/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink mb-1">{faq.question}</p>
                  <p className="text-sm text-ink/60 line-clamp-2">{faq.answer}</p>
                  <p className="text-xs text-ink/30 mt-1">Order: {faq.displayOrder ?? 0}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(faq)}
                    className={`text-xs px-2 py-0.5 rounded-full ${faq.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                  >
                    {faq.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleEdit(faq)} className="text-xs text-ink/40 hover:text-gold transition-colors">Edit</button>
                  <button onClick={() => handleDelete(faq._id)} className="text-xs text-ink/40 hover:text-error transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
