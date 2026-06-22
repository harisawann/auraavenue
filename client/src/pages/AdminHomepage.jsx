import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';

const SECTIONS = [
  { key: 'hero', label: 'Hero Banner', description: 'Main banner shown at the top of the homepage.' },
  { key: 'promo_banner', label: 'Promo Banner', description: 'Secondary promotional banner below hero.' },
  { key: 'sale_banner', label: 'Sale Banner', description: 'Special sale / seasonal offer banner.' },
];

export default function AdminHomepage() {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/homepage-sections')
      .then(({ data }) => {
        const map = {};
        (data.sections || []).forEach((s) => { map[s.key] = s; });
        setSections(map);
      })
      .catch(() => setError('Failed to load homepage sections.'))
      .finally(() => setLoading(false));
  }, []);

  const getForm = (key) => {
    const s = sections[key];
    return {
      title: s?.title || '',
      subtitle: s?.subtitle || '',
      ctaText: s?.ctaText || '',
      ctaUrl: s?.ctaUrl || '',
      isActive: s?.isActive ?? true,
    };
  };

  const updateField = (key, field, value) => {
    setSections((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || { key }), [field]: value }
    }));
  };

  const handleSave = async (key) => {
    setSaving(key);
    setSuccess('');
    try {
      const form = getForm(key);
      const { data } = await api.put(`/homepage-sections/${key}`, form);
      setSections((prev) => ({ ...prev, [key]: data.section }));
      setSuccess(`"${key}" section saved!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      alert('Save failed.');
    } finally {
      setSaving(null);
    }
  };

  const inp = 'w-full border border-sand-dark rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold';

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-ink mb-2">Homepage Editor</h1>
      <p className="text-sm text-ink/50 mb-8">Manage the content shown on the homepage banner sections.</p>

      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-sm animate-fadeIn">
          ✓ {success}
        </div>
      )}
      {error && <p className="text-sm text-error mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink/60 animate-pulse">Loading...</p>
      ) : (
        <div className="space-y-6">
          {SECTIONS.map(({ key, label, description }) => {
            const s = sections[key] || {};
            return (
              <div key={key} className="bg-white border border-sand-dark rounded-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg text-ink">{label}</h2>
                  <label className="flex items-center gap-2 text-sm text-ink/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.isActive ?? true}
                      onChange={(e) => updateField(key, 'isActive', e.target.checked)}
                      className="accent-gold"
                    />
                    Active
                  </label>
                </div>
                <p className="text-xs text-ink/40 mb-4">{description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-ink/50 mb-1 block">Title</label>
                    <input
                      className={inp}
                      value={s.title || ''}
                      onChange={(e) => updateField(key, 'title', e.target.value)}
                      placeholder="Premium Kitchen Essentials, Delivered."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-ink/50 mb-1 block">Subtitle / Description</label>
                    <textarea
                      className={`${inp} h-16 resize-y`}
                      value={s.subtitle || ''}
                      onChange={(e) => updateField(key, 'subtitle', e.target.value)}
                      placeholder="Thoughtfully designed accessories, made to last."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink/50 mb-1 block">CTA Button Text</label>
                    <input
                      className={inp}
                      value={s.ctaText || ''}
                      onChange={(e) => updateField(key, 'ctaText', e.target.value)}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ink/50 mb-1 block">CTA Link URL</label>
                    <input
                      className={inp}
                      value={s.ctaUrl || ''}
                      onChange={(e) => updateField(key, 'ctaUrl', e.target.value)}
                      placeholder="/shop"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={() => handleSave(key)}
                    loading={saving === key}
                    variant="secondary"
                  >
                    Save {label}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
