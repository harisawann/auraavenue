import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';
import Input from '../components/Input';

const emptyForm = { title: '', message: '', audience: 'customer', link: '' };

const typeStyles = {
  order: 'bg-sand text-ink/70',
  low_stock: 'bg-red-100 text-red-700',
  announcement: 'bg-gold/15 text-gold-dark',
  system: 'bg-sand text-ink/70',
  promo: 'bg-green-100 text-green-700'
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data.notifications);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await notificationService.send({ ...form, type: 'announcement' });
      await fetchNotifications();
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Notifications</h1>
        <Button onClick={() => setShowForm(true)}>+ Send announcement</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            className="bg-paper rounded-sm border border-sand-dark p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSend}
          >
            <h2 className="font-display text-xl text-ink mb-5">Send announcement</h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Eid Sale starts tomorrow!"
              />
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-ink/60 mb-1.5 block">Message</label>
                <textarea
                  required
                  className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink outline-none focus:border-ink transition-colors h-24 resize-y"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Get 20% off everything this weekend only."
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-ink/60 mb-1.5 block">Send to</label>
                <select
                  className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink outline-none focus:border-ink transition-colors"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                >
                  <option value="customer">All customers</option>
                  <option value="admin">All admins</option>
                </select>
              </div>
              <Input
                label="Link (optional)"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                placeholder="/shop"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <Button type="submit" loading={sending}>
                Send
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink/60 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-ink/50">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div key={n._id} className="bg-white border border-sand-dark rounded-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink mb-1">{n.title}</p>
                  <p className="text-sm text-ink/60">{n.message}</p>
                  <p className="text-xs text-ink/30 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                    {n.recipient ? ` · to ${n.recipient.name}` : ` · broadcast to ${n.audience}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${typeStyles[n.type] || 'bg-sand text-ink/70'}`}>
                  {n.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
