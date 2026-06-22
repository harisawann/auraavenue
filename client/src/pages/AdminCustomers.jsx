import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { notificationService } from '../services/notificationService';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messagingId, setMessagingId] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminService.getCustomers({ page });
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch {
      setError('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleStatus = async (customer) => {
    try {
      await adminService.updateCustomerStatus(customer._id, !customer.isActive);
      setCustomers((prev) =>
        prev.map((c) => (c._id === customer._id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch {
      alert('Could not update customer status.');
    }
  };

  const handleSendMessage = async (customerId) => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await notificationService.send({
        title: 'Message from Aura Avenue',
        message: messageText.trim(),
        recipientId: customerId,
        type: 'announcement'
      });
      setMessagingId(null);
      setMessageText('');
    } catch {
      alert('Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-ink mb-8">Customers</h1>

      {loading ? (
        <p className="text-sm text-ink/60 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-ink/50">No customers yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border border-sand-dark rounded-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-dark text-left text-ink/50">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Orders</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Total spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} className="border-b border-sand-dark last:border-0">
                    <td className="py-3 px-4 text-ink">{c.name}</td>
                    <td className="py-3 px-4 text-ink/70">{c.email}</td>
                    <td className="py-3 px-4 hidden sm:table-cell text-ink/70">{c.orderCount}</td>
                    <td className="py-3 px-4 hidden sm:table-cell text-ink/70">Rs. {c.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                      >
                        {c.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      {messagingId === c._id ? (
                        <div className="flex flex-col gap-2 max-w-xs">
                          <textarea
                            autoFocus
                            className="w-full text-sm border border-sand-dark rounded-sm px-2 py-1.5 outline-none focus:border-gold"
                            rows={2}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message..."
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => handleSendMessage(c._id)} loading={sending} className="!px-3 !py-1.5 text-xs">
                              Send
                            </Button>
                            <Button variant="ghost" onClick={() => { setMessagingId(null); setMessageText(''); }} className="!px-3 !py-1.5 text-xs">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setMessagingId(c._id)} className="text-xs text-ink/50 hover:text-ink">
                          Message
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchCustomers(i + 1)}
                  className={`h-8 w-8 rounded-sm text-sm ${
                    pagination.page === i + 1 ? 'bg-ink text-paper' : 'text-ink/60 hover:bg-sand'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
