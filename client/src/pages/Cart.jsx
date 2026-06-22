import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import Button from '../components/Button';

export default function Cart() {
  const { cart, updateItem, removeItem, loading } = useCart();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdatingId(productId);
    const result = await updateItem(productId, newQty);
    setUpdatingId(null);
    if (!result.success) toast.error(result.message);
  };

  const handleRemove = async (productId, name) => {
    setUpdatingId(productId);
    const result = await removeItem(productId);
    setUpdatingId(null);
    if (result.success) toast.success(`Removed ${name}`);
    else toast.error(result.message);
  };

  if (!loading && cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl text-ink mb-2">Your cart is empty</p>
          <p className="text-sm text-ink/60 mb-6">Browse the shop to find something you'll love.</p>
          <Link to="/shop">
            <Button>Browse the shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-ink mb-8">Your Cart</h1>

        <div className="flex flex-col gap-4 mb-8">
          {cart.items.map((item) => (
            <div
              key={item.product._id}
              className="flex gap-4 p-4 bg-white border border-sand-dark rounded-sm"
            >
              <Link to={`/products/${item.product.slug}`} className="h-20 w-20 flex-shrink-0 rounded-sm overflow-hidden bg-sand">
                {item.product.images?.[0] && (
                  <img src={item.product.images[0].url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <Link to={`/products/${item.product.slug}`} className="font-display text-lg text-ink hover:text-gold-dark transition-colors truncate">
                  {item.product.name}
                </Link>
                <span className="text-sm text-ink/60 mb-2">Rs. {item.product.price.toLocaleString()} each</span>

                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center border border-sand-dark rounded-sm">
                    <button
                      onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                      disabled={updatingId === item.product._id}
                      className="px-2.5 py-1 text-ink/60 hover:text-ink disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-3 text-sm w-7 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                      disabled={updatingId === item.product._id || item.quantity >= item.product.stock}
                      className="px-2.5 py-1 text-ink/60 hover:text-ink disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.product._id, item.product.name)}
                    disabled={updatingId === item.product._id}
                    className="text-xs text-ink/50 hover:text-error transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="font-display text-lg text-ink flex-shrink-0">
                Rs. {item.lineTotal.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-sand-dark pt-6 flex flex-col items-end gap-1">
          <div className="flex justify-between w-full max-w-xs text-sm text-ink/60">
            <span>Subtotal</span>
            <span>Rs. {cart.subtotal.toLocaleString()}</span>
          </div>
          <p className="text-xs text-ink/40 mb-4">Shipping and any discount calculated at checkout</p>
          <Button onClick={() => navigate('/checkout')} className="w-full max-w-xs">
            Proceed to checkout
          </Button>
        </div>
      </main>
    </div>
  );
}
