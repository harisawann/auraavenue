import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/reviews/admin/all');
      setReviews(data.reviews || []);
    } catch {
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert('Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-ink mb-8">Reviews</h1>

      {loading ? (
        <p className="text-sm text-ink/60 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink/50">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-sand-dark rounded-sm p-4 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-gold text-sm">{stars(review.rating)}</span>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified Purchase</span>
                    )}
                    <span className="text-xs text-ink/40">{new Date(review.createdAt).toLocaleDateString('en-PK')}</span>
                  </div>

                  {review.title && <p className="text-sm font-medium text-ink mb-1">{review.title}</p>}
                  {review.comment && <p className="text-sm text-ink/70 mb-2">"{review.comment}"</p>}

                  <div className="flex gap-4 text-xs text-ink/40">
                    <span>By: <span className="text-ink/60">{review.user?.name || 'Unknown'}</span></span>
                    <span>Product: <span className="text-ink/60">{review.product?.name || 'Unknown'}</span></span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(review._id)}
                  disabled={deletingId === review._id}
                  className="text-xs text-ink/30 hover:text-error transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {deletingId === review._id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
