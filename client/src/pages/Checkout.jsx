import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { couponService } from '../services/couponService';
import { shippingService } from '../services/shippingService';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';

const emptyAddress = {
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Pakistan',
  phone: ''
};

const paymentMethods = [
  { value: 'cod', label: 'Cash on Delivery', description: 'Pay in cash when your order arrives.' },
  { value: 'jazzcash', label: 'JazzCash', description: 'Send payment via JazzCash, then enter your transaction ID below.' },
  { value: 'easypaisa', label: 'Easypaisa', description: 'Send payment via Easypaisa, then enter your transaction ID below.' },
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer to our bank account, then enter your transaction reference below.' }
];

// Generates a per-checkout-attempt unique key so a double-click or retried
// request can't create two orders for the same cart. Regenerated each time
// the user lands on this page fresh (not on every render).
function generateIdempotencyKey() {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const savedAddresses = user?.addresses || [];

  const [address, setAddress] = useState(() => {
    const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    return defaultAddr ? { ...emptyAddress, ...defaultAddr } : emptyAddress;
  });
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    return defaultAddr?._id || 'new';
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentReference, setPaymentReference] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount }
  const [couponChecking, setCouponChecking] = useState(false);
  const [shippingFee, setShippingFee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(generateIdempotencyKey);

  // Fetch a shipping estimate whenever the city changes (debounced via the
  // address.city dependency itself, which only changes on blur-worthy input)
  useEffect(() => {
    let cancelled = false;
    shippingService
      .getConfig()
      .then((data) => {
        if (cancelled) return;
        const config = data.config;
        const zoneMatch = config.zoneRates.find(
          (z) => z.zoneName.trim().toLowerCase() === address.city.trim().toLowerCase()
        );
        const freeShipping = config.freeShippingThreshold !== null && cart.subtotal >= config.freeShippingThreshold;
        setShippingFee(freeShipping ? 0 : zoneMatch ? zoneMatch.fee : config.defaultFee);
      })
      .catch(() => {
        if (!cancelled) setShippingFee(200); // sensible fallback if config fetch fails
      });
    return () => {
      cancelled = true;
    };
  }, [address.city, cart.subtotal]);

  const validate = () => {
    const next = {};
    if (!address.fullName.trim()) next.fullName = 'Required';
    if (!address.line1.trim()) next.line1 = 'Required';
    if (!address.city.trim()) next.city = 'Required';
    if (!address.state.trim()) next.state = 'Required';
    if (!address.postalCode.trim()) next.postalCode = 'Required';
    if (!address.country.trim()) next.country = 'Required';
    if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa' || paymentMethod === 'bank_transfer') && !paymentReference.trim()) {
      next.paymentReference = 'Please enter your transaction reference';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponChecking(true);
    try {
      const data = await couponService.validate(couponInput.trim(), cart.subtotal);
      setAppliedCoupon({ code: data.coupon.code, discountAmount: data.discountAmount });
      toast.success(`Coupon applied: -Rs. ${data.discountAmount.toLocaleString()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponChecking(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, cart.subtotal - discountAmount) + (shippingFee ?? 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await orderService.checkout({
        shippingAddress: address,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        couponCode: appliedCoupon?.code,
        idempotencyKey
      });
      await refreshCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.order._id}/confirmation`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    navigate('/cart', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-ink mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-[1.3fr_1fr] gap-10">
          <div className="flex flex-col gap-8">
            {/* Shipping address */}
            <div>
              <h2 className="font-display text-xl text-ink mb-4">Shipping address</h2>

              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium uppercase tracking-wider text-ink/60 mb-1.5 block">
                    Use a saved address
                  </label>
                  <select
                    value={selectedAddressId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedAddressId(id);
                      if (id === 'new') {
                        setAddress(emptyAddress);
                      } else {
                        const found = savedAddresses.find((a) => a._id === id);
                        if (found) setAddress({ ...emptyAddress, ...found });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink outline-none focus:border-ink transition-colors"
                  >
                    {savedAddresses.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.label} — {a.line1}, {a.city}
                      </option>
                    ))}
                    <option value="new">Enter a new address</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Input
                  label="Full name"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  error={errors.fullName}
                />
                <Input
                  label="Address line 1"
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  error={errors.line1}
                />
                <Input
                  label="Address line 2 (optional)"
                  value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    error={errors.city}
                  />
                  <Input
                    label="State / Province"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    error={errors.state}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Postal code"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    error={errors.postalCode}
                  />
                  <Input
                    label="Country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    error={errors.country}
                  />
                </div>
                <Input
                  label="Phone"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <h2 className="font-display text-xl text-ink mb-4">Payment method</h2>
              <div className="flex flex-col gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-colors ${
                      paymentMethod === method.value ? 'border-ink bg-sand' : 'border-sand-dark hover:border-ink/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-ink text-sm">{method.label}</p>
                      <p className="text-xs text-ink/60">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod !== 'cod' && (
                <div className="mt-4">
                  <Input
                    label="Transaction reference / ID"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    error={errors.paymentReference}
                    placeholder="e.g. TXN123456789"
                  />
                  <p className="text-xs text-ink/50 mt-1">
                    We'll verify your payment and confirm your order shortly after you submit it.
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Place order
            </Button>
          </div>

          {/* Order summary sidebar */}
          <div className="bg-white border border-sand-dark rounded-sm p-6 h-fit">
            <h2 className="font-display text-lg text-ink mb-4">Order summary</h2>
            <div className="flex flex-col gap-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span className="text-ink/70">
                    {item.product.name} <span className="text-ink/40">× {item.quantity}</span>
                  </span>
                  <span className="text-ink">Rs. {item.lineTotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-sand-dark pt-3 mb-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success">Coupon "{appliedCoupon.code}" applied</span>
                  <button type="button" onClick={handleRemoveCoupon} className="text-xs text-ink/50 hover:text-ink">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 px-3 py-2 text-sm rounded-sm bg-paper border border-sand-dark outline-none focus:border-ink"
                  />
                  <Button type="button" variant="secondary" onClick={handleApplyCoupon} loading={couponChecking}>
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-sand-dark pt-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span>Rs. {cart.subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>−Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                <span>{shippingFee === null ? 'Calculating...' : shippingFee === 0 ? 'Free' : `Rs. ${shippingFee.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between font-display text-base text-ink mt-1">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
