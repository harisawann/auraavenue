import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import AdminLayout from '../components/AdminLayout';

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-sand-dark rounded-sm p-5">
      <p className="text-xs uppercase tracking-wider text-ink/50 mb-1">{label}</p>
      <p className="font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminService
      .getDashboard()
      .then((data) => {
        if (!cancelled) setAnalytics(data.analytics);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-ink mb-8">Dashboard</h1>

      {loading ? (
        <p className="text-sm text-ink/60">Loading...</p>
      ) : !analytics ? (
        <p className="text-sm text-error">Could not load analytics.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Sales" value={`Rs. ${analytics.totalSales.toLocaleString()}`} />
            <StatCard label="Today's Sales" value={`Rs. ${analytics.dailySales.toLocaleString()}`} />
            <StatCard label="This Month" value={`Rs. ${analytics.monthlySales.toLocaleString()}`} />
            <StatCard label="Total Products" value={analytics.totalProducts} />
            <StatCard label="Total Orders" value={analytics.totalOrders} />
            <StatCard label="Pending Orders" value={analytics.pendingOrders} />
            <StatCard label="Completed Orders" value={analytics.completedOrders} />
            <StatCard label="Total Customers" value={analytics.totalCustomers} />
          </div>

          <div className="bg-white border border-sand-dark rounded-sm p-5">
            <h2 className="font-display text-lg text-ink mb-4">Best Selling Products</h2>
            {analytics.bestSellingProducts.length === 0 ? (
              <p className="text-sm text-ink/50">No sales yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {analytics.bestSellingProducts.map((p, i) => (
                  <div key={p._id || i} className="flex justify-between text-sm">
                    <span className="text-ink">{p.name}</span>
                    <span className="text-ink/60">{p.totalSold} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
