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
          <button
  onClick={() => {
    const phone = '923255910645';

    const itemLines = cart.items
      .map(
        (item) =>
          `- ${item.product.name} x${item.quantity} = Rs. ${item.lineTotal.toLocaleString()}`
      )
      .join('\n');

    const msg = `Hi! I want to place an order:

${itemLines}

Total: Rs. ${cart.subtotal.toLocaleString()}

Please confirm my order and share payment details.`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }}
  className="w-full max-w-xs mt-2 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white py-3 rounded-sm text-sm font-medium transition-colors"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
    />
  </svg>

  Order via WhatsApp
</button>
        </div>
      </main>
    </div>
  );
}
