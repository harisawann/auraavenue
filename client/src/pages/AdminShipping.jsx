import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';

export default function AdminShipping() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/shipping-config')
      .then(({ data }) => setConfig(data.config))
      .catch(() => setError('Failed to load shipping config.'))
      .finally(() => setLoading(false));
  }, []);

  const addZone = () => {
    setConfig((prev) => ({
      ...prev,
      zoneRates: [...(prev.zoneRates || []), { zoneName: '', fee: 0, estimatedDays: '3-5' }]
    }));
  };

  const removeZone = (i) => {
    setConfig((prev) => ({
      ...prev,
      zoneRates: prev.zoneRates.filter((_, idx) => idx !== i)
    }));
  };

  const updateZone = (i, field, value) => {
    setConfig((prev) => ({
      ...prev,
      zoneRates: prev.zoneRates.map((z, idx) =>
        idx === i ? { ...z, [field]: field === 'fee' ? Number(value) : value } : z
      )
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      const { data } = await api.put('/shipping-config', {
        defaultFee: Number(config.defaultFee),
        freeShippingThreshold: config.freeShippingThreshold !== '' ? Number(config.freeShippingThreshold) : null,
        defaultEstimatedDays: config.defaultEstimatedDays,
        zoneRates: config.zoneRates,
        shippingPolicyText: config.shippingPolicyText
      });
      setConfig(data.config);
      setSuccess('Shipping configuration saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      alert('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full border border-sand-dark rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold';

  if (loading) return <AdminLayout><p className="text-sm text-ink/60 animate-pulse">Loading...</p></AdminLayout>;
  if (error) return <AdminLayout><p className="text-sm text-error">{error}</p></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-ink mb-8">Shipping Configuration</h1>

      {success && (
        <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-sm animate-fadeIn">
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        {/* Base Settings */}
        <div className="bg-white border border-sand-dark rounded-sm p-5">
          <h2 className="font-display text-lg text-ink mb-4">Base Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Default Shipping Fee (Rs.) *</label>
              <input
                className={inp} type="number" min="0" required
                value={config.defaultFee ?? ''}
                onChange={(e) => setConfig({ ...config, defaultFee: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Free Shipping Above (Rs.)</label>
              <input
                className={inp} type="number" min="0"
                value={config.freeShippingThreshold ?? ''}
                onChange={(e) => setConfig({ ...config, freeShippingThreshold: e.target.value })}
                placeholder="Leave blank to disable"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-ink/50 mb-1 block">Default Estimated Delivery</label>
              <input
                className={inp}
                value={config.defaultEstimatedDays ?? ''}
                onChange={(e) => setConfig({ ...config, defaultEstimatedDays: e.target.value })}
                placeholder="e.g. 3-5 business days"
              />
            </div>
          </div>
        </div>

        {/* Zone Rates */}
        <div className="bg-white border border-sand-dark rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Zone Rates</h2>
            <Button type="button" variant="secondary" onClick={addZone}>+ Add Zone</Button>
          </div>
          {(config.zoneRates || []).length === 0 ? (
            <p className="text-sm text-ink/40">No zones configured. Add a zone for city-specific pricing.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {config.zoneRates.map((zone, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-xs text-ink/50 mb-1 block">City / Zone</label>
                    <input className={inp} value={zone.zoneName} onChange={(e) => updateZone(i, 'zoneName', e.target.value)} placeholder="Karachi" />
                  </div>
                  <div>
                    <label className="text-xs text-ink/50 mb-1 block">Fee (Rs.)</label>
                    <input className={inp} type="number" min="0" value={zone.fee} onChange={(e) => updateZone(i, 'fee', e.target.value)} />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-ink/50 mb-1 block">Est. Days</label>
                      <input className={inp} value={zone.estimatedDays} onChange={(e) => updateZone(i, 'estimatedDays', e.target.value)} placeholder="1-2" />
                    </div>
                    <button type="button" onClick={() => removeZone(i)} className="mb-0.5 text-error/60 hover:text-error text-sm transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Policy Text */}
        <div className="bg-white border border-sand-dark rounded-sm p-5">
          <h2 className="font-display text-lg text-ink mb-4">Shipping Policy Text</h2>
          <textarea
            className={`${inp} h-32 resize-y`}
            value={config.shippingPolicyText ?? ''}
            onChange={(e) => setConfig({ ...config, shippingPolicyText: e.target.value })}
            placeholder="Describe your shipping policy..."
          />
        </div>

        <Button type="submit" loading={saving}>Save Configuration</Button>
      </form>
    </AdminLayout>
  );
}
