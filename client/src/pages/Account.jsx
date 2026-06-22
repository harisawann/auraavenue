import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Input from '../components/Input';
import Button from '../components/Button';

const emptyAddress = {
  label: 'Home',
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Pakistan',
  phone: '',
  isDefault: false
};

function AddressForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="flex flex-col gap-4 bg-cream border border-sand-dark rounded-sm p-5"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Label (e.g. Home, Office)" value={form.label} onChange={handleChange('label')} />
        <Input label="Full name" value={form.fullName} onChange={handleChange('fullName')} required />
      </div>
      <Input label="Address line 1" value={form.line1} onChange={handleChange('line1')} required />
      <Input label="Address line 2 (optional)" value={form.line2} onChange={handleChange('line2')} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="City" value={form.city} onChange={handleChange('city')} required />
        <Input label="State / Province" value={form.state} onChange={handleChange('state')} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Postal code" value={form.postalCode} onChange={handleChange('postalCode')} required />
        <Input label="Country" value={form.country} onChange={handleChange('country')} required />
      </div>
      <Input label="Phone" value={form.phone} onChange={handleChange('phone')} />

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
        />
        Set as default address
      </label>

      <div className="flex gap-3 mt-2">
        <Button type="submit" loading={saving}>
          Save address
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function Account() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [editingId, setEditingId] = useState(null); // address _id being edited, or 'new'
  const [savingAddress, setSavingAddress] = useState(false);

  const persistAddresses = async (nextAddresses) => {
    setSavingAddress(true);
    try {
      const data = await authService.updateMe({ addresses: nextAddresses });
      setAddresses(data.user.addresses);
      setUser(data.user);
      setEditingId(null);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const data = await authService.updateMe({ name: name.trim(), phone: phone.trim() });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = (form) => {
    let next;
    if (editingId === 'new') {
      next = [...addresses, form];
    } else {
      next = addresses.map((a) => (a._id === editingId ? { ...a, ...form } : a));
    }
    // Only one address can be default; unset others if this one was just set.
    if (form.isDefault) {
      next = next.map((a) => (a === form || a._id === editingId ? a : { ...a, isDefault: false }));
    }
    persistAddresses(next);
  };

  const handleDeleteAddress = (id) => {
    if (!window.confirm('Remove this address?')) return;
    persistAddresses(addresses.filter((a) => a._id !== id));
  };

  const handleSetDefault = (id) => {
    persistAddresses(addresses.map((a) => ({ ...a, isDefault: a._id === id })));
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-ink mb-2">My Account</h1>
        <p className="text-sm text-ink/60 mb-10">{user?.email}</p>

        <div className="flex gap-4 mb-10">
          <Link to="/orders" className="text-sm text-ink/70 hover:text-ink border border-sand-dark px-4 py-2 rounded-sm hover:border-gold transition-colors">
            Order history
          </Link>
          <Link to="/wishlist" className="text-sm text-ink/70 hover:text-ink border border-sand-dark px-4 py-2 rounded-sm hover:border-gold transition-colors">
            Wishlist
          </Link>
        </div>

        {/* Profile */}
        <section className="mb-12">
          <h2 className="font-display text-xl text-ink mb-4">Profile</h2>
          <form onSubmit={handleSaveProfile} className="bg-white border border-sand-dark rounded-sm p-6 flex flex-col gap-4 max-w-md">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xxxxxxxxx" />
            <Button type="submit" loading={savingProfile} className="self-start">
              Save changes
            </Button>
          </form>
        </section>

        {/* Saved addresses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Saved Addresses</h2>
            {editingId === null && (
              <Button variant="secondary" onClick={() => setEditingId('new')}>
                + Add address
              </Button>
            )}
          </div>

          {editingId === 'new' && (
            <div className="mb-6">
              <AddressForm
                initial={emptyAddress}
                onSave={handleSaveAddress}
                onCancel={() => setEditingId(null)}
                saving={savingAddress}
              />
            </div>
          )}

          {addresses.length === 0 && editingId === null && (
            <p className="text-sm text-ink/50">No saved addresses yet. Add one to speed up checkout.</p>
          )}

          <div className="flex flex-col gap-4">
            {addresses.map((addr) =>
              editingId === addr._id ? (
                <AddressForm
                  key={addr._id}
                  initial={addr}
                  onSave={handleSaveAddress}
                  onCancel={() => setEditingId(null)}
                  saving={savingAddress}
                />
              ) : (
                <div key={addr._id} className="bg-white border border-sand-dark rounded-sm p-5 flex justify-between gap-4">
                  <div className="text-sm text-ink/70">
                    <p className="font-medium text-ink mb-1">
                      {addr.label}
                      {addr.isDefault && (
                        <span className="ml-2 text-xs text-gold-dark bg-gold/10 px-2 py-0.5 rounded-sm">Default</span>
                      )}
                    </p>
                    <p>{addr.fullName}</p>
                    <p>
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}
                    </p>
                    <p>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p>{addr.country}</p>
                    {addr.phone && <p>{addr.phone}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <button onClick={() => setEditingId(addr._id)} className="text-xs text-ink/60 hover:text-ink">
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button onClick={() => handleSetDefault(addr._id)} className="text-xs text-ink/60 hover:text-ink">
                        Set default
                      </button>
                    )}
                    <button onClick={() => handleDeleteAddress(addr._id)} className="text-xs text-error hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
