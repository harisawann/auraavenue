import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService } from '../services/wishlistService';
import { useWishlist } from '../context/WishlistContext';
import Header from '../components/Header';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { count } = useWishlist(); // re-fetch whenever the wishlist count changes elsewhere

  useEffect(() => {
    let cancelled = false;
    wishlistService
      .getWishlist()
      .then((data) => {
        if (!cancelled) setProducts(data.wishlist.products);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [count]);

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl text-ink mb-8">Your Wishlist</h1>

        {loading ? (
          <p className="text-sm text-ink/60">Loading...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl text-ink mb-2">Your wishlist is empty</p>
            <p className="text-sm text-ink/60 mb-6">Save products you love to find them here later.</p>
            <Link to="/shop">
              <Button>Browse the shop</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
