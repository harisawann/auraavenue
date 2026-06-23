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

const ADVANCE_AMOUNT = 300; // PKR advance payment required

const emptyAddress = {
  fullName: '', line1: '', line2: '', city: '', state: '',
  postalCode: '', country: 'Pakistan', phone: ''
};

const paymentMethods = [
  {
    value: 'jazzcash', label: 'JazzCash',
    icon: '📱',
    description: 'Send PKR 300 advance to JazzCash number: 0300-1234567',
    instructions: [
      'Open JazzCash app or dial *786#',
      `Send PKR ${ADVANCE_AMOUNT} to: 0300-1234567 (Haris Awan)`,
      'Enter your Transaction ID below',
      'Remaining amount paid on delivery'
    ]
  },
  {
    value: 'easypaisa', label: 'Easypaisa',
    icon: '💚',
    description: 'Send PKR 300 advance to Easypaisa number: 0300-1234567',
    instructions: [
      'Open Easypaisa app or dial *786#',
      `Send PKR ${ADVANCE_AMOUNT} to: 0300-1234567 (Haris Awan)`,
      'Enter your Transaction ID below',
      'Remaining amount paid on delivery'
    ]
  },
  {
    value: 'bank_transfer', label: 'Bank Transfer',
    icon: '🏦',
    description: 'Transfer PKR 300 advance to our bank account',
    instructions: [
      'Bank: HBL / Meezan Bank',
      'Account Title: Aura Avenue',
      'Account No: 1234-5678-9012',
      `Transfer PKR ${ADVANCE_AMOUNT} and enter reference below`
    ]
  },
  {
    value: 'cod', label: 'Cash on Delivery',
    icon: '💵',
    description: 'No advance required — pay full amount on delivery.',
    instructions: []
  }
];

function generateIdempotencyKey() {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 text-xs px-2 py-0.5 rounded bg-gold/10 text-gold-dark hover:bg-gold/20 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
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
  const [paymentMethod, setPaymentMethod] = useState('jazzcash');
  const [paymentReference, setPaymentReference] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [shippingFee, setShippingFee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(generateIdempotencyKey);
  const [step, setStep] = useState(1); // 1=address, 2=payment

  useEffect(() => {
    let cancelled = false;
    shippingService.getConfig().then((data) => {
      if (cancelled) return;
      const config = data.config;
      const zoneMatch = config.zoneRates.find(
        (z) => z.zoneName.trim().toLowerCase() === address.city.trim().toLowerCase()
      );
      const freeShipping = config.freeShippingThreshold !== null && cart.subtotal >= config.freeShippingThreshold;
      setShippingFee(freeShipping ? 0 : zoneMatch ? zoneMatch.fee : config.defaultFee);
    }).catch(() => { if (!cancelled) setShippingFee(200); });
    return () => { cancelled = true; };
  }, [address.city, cart.subtotal]);

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, cart.subtotal - discountAmount) + (shippingFee ?? 0);
  const selectedMethod = paymentMethods.find((m) => m.value === paymentMethod);
  const requiresAdvance = paymentMethod !== 'cod';
  const codAmount = requiresAdvance ? Math.max(0, total - ADVANCE_AMOUNT) : total;

  const validate = () => {
    const next = {};
    if (!address.fullName.trim()) next.fullName = 'Required';
    if (!address.line1.trim()) next.line1 = 'Required';
    if (!address.city.trim()) next.city = 'Required';
    if (!address.state.trim()) next.state = 'Required';
    if (!address.postalCode.trim()) next.postalCode = 'Required';
    if (!address.country.trim()) next.country = 'Required';
    if (requiresAdvance && !paymentReference.trim()) {
      next.paymentReference = 'Please enter your transaction ID to confirm advance payment';
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
        <h1 className="font-display text-3xl text-ink mb-2">Checkout</h1>

        {/* Advance payment notice */}
        {requiresAdvance && (
          <div className="mb-6 bg-gold/10 border border-gold/30 rounded-sm px-5 py-4">
            <p className="text-sm text-ink font-medium mb-1">💡 Advance Payment Required</p>
            <p className="text-sm text-ink/70">
              An advance of <strong>PKR {ADVANCE_AMOUNT.toLocaleString()}</strong> is required to confirm your order.
              The remaining <strong>PKR {codAmount.toLocaleString()}</strong> will be collected on delivery.
            </p>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${step === 1 ? 'text-ink' : 'text-ink/40 hover:text-ink/70'}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-ink text-paper' : step > 1 ? 'bg-gold text-paper' : 'bg-sand-dark text-ink/40'}`}>
              {step > 1 ? '✓' : '1'}
            </span>
            Shipping
          </button>
          <div className="flex-1 h-px bg-sand-dark max-w-12" />
          <button
            type="button"
            onClick={() => step > 1 && setStep(2)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${step === 2 ? 'text-ink' : 'text-ink/40'}`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-ink text-paper' : 'bg-sand-dark text-ink/40'}`}>
              2
            </span>
            Payment
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-[1.3fr_1fr] gap-10">
          <div className="flex flex-col gap-8">

            {/* STEP 1: Shipping */}
            {step === 1 && (
              <div>
                <h2 className="font-display text-xl text-ink mb-4">Shipping Address</h2>
                {savedAddresses.length > 0 && (
                  <div className="mb-4">
                    <label className="text-xs font-medium uppercase tracking-wider text-ink/60 mb-1.5 block">Use a saved address</label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedAddressId(id);
                        if (id === 'new') setAddress(emptyAddress);
                        else { const found = savedAddresses.find((a) => a._id === id); if (found) setAddress({ ...emptyAddress, ...found }); }
                      }}
                      className="w-full px-4 py-3 rounded-sm bg-paper border border-sand-dark text-ink outline-none focus:border-ink transition-colors"
                    >
                      {savedAddresses.map((a) => (<option key={a._id} value={a._id}>{a.label} — {a.line1}, {a.city}</option>))}
                      <option value="new">Enter a new address</option>
                    </select>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <Input label="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} error={errors.fullName} />
                  <Input label="Address line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} error={errors.line1} />
                  <Input label="Address line 2 (optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} error={errors.city} />
                    <Input label="State / Province" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} error={errors.state} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Postal code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} error={errors.postalCode} />
                    <Input label="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} error={errors.country} />
                  </div>
                  <Input label="Phone number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="03XX-XXXXXXX" />
                </div>
                <Button type="button" className="w-full mt-6" onClick={() => {
                  const next = {};
                  if (!address.fullName.trim()) next.fullName = 'Required';
                  if (!address.line1.trim()) next.line1 = 'Required';
                  if (!address.city.trim()) next.city = 'Required';
                  if (!address.state.trim()) next.state = 'Required';
                  if (!address.postalCode.trim()) next.postalCode = 'Required';
                  setErrors(next);
                  if (Object.keys(next).length === 0) setStep(2);
                }}>
                  Continue to Payment →
                </Button>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div>
                <h2 className="font-display text-xl text-ink mb-4">Payment Method</h2>

                <div className="flex flex-col gap-3 mb-6">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-all ${paymentMethod === method.value ? 'border-ink bg-sand' : 'border-sand-dark hover:border-ink/40'}`}
                    >
                      <input type="radio" name="paymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} className="mt-1" />
                      <div>
                        <p className="font-medium text-ink text-sm">{method.icon} {method.label}</p>
                        <p className="text-xs text-ink/60 mt-0.5">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Payment instructions */}
                {selectedMethod && selectedMethod.instructions.length > 0 && (
                  <div className="bg-cream border border-sand-dark rounded-sm p-4 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-3">Step-by-step instructions</p>
                    <ol className="flex flex-col gap-2">
                      {selectedMethod.instructions.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/20 text-gold-dark text-xs flex items-center justify-center font-medium">{i + 1}</span>
                          <span>
                            {step}
                            {step.includes('0300-1234567') && <CopyButton text="03001234567" />}
                            {step.includes('1234-5678-9012') && <CopyButton text="1234567890123" />}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Transaction reference for non-COD */}
                {requiresAdvance && (
                  <div className="mb-4">
                    <Input
                      label={`Transaction ID (PKR ${ADVANCE_AMOUNT} advance paid)`}
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      error={errors.paymentReference}
                      placeholder="e.g. TXN123456789"
                    />
                    <p className="text-xs text-ink/50 mt-1">
                      Enter the transaction ID from your payment. Your order will be confirmed after verification.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="submit" loading={submitting} className="flex-1">
                    Place Order {requiresAdvance ? `(PKR ${ADVANCE_AMOUNT} advance)` : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="bg-white border border-sand-dark rounded-sm p-6 h-fit sticky top-24">
            <h2 className="font-display text-lg text-ink mb-4">Order Summary</h2>
            <div className="flex flex-col gap-3 mb-4 max-h-48 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span className="text-ink/70">{item.product.name} <span className="text-ink/40">× {item.quantity}</span></span>
                  <span className="text-ink">Rs. {item.lineTotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-sand-dark pt-3 mb-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Coupon "{appliedCoupon.code}" applied</span>
                  <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="text-xs text-ink/50 hover:text-ink">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" className="flex-1 px-3 py-2 text-sm rounded-sm bg-paper border border-sand-dark outline-none focus:border-ink" />
                  <Button type="button" variant="secondary" onClick={handleApplyCoupon} loading={couponChecking}>Apply</Button>
                </div>
              )}
            </div>

            <div className="border-t border-sand-dark pt-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-ink/60"><span>Subtotal</span><span>Rs. {cart.subtotal.toLocaleString()}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−Rs. {discountAmount.toLocaleString()}</span></div>}
              <div className="flex justify-between text-ink/60"><span>Shipping</span><span>{shippingFee === null ? 'Calculating...' : shippingFee === 0 ? 'Free' : `Rs. ${shippingFee.toLocaleString()}`}</span></div>
              <div className="flex justify-between font-display text-base text-ink mt-1 pt-1 border-t border-sand-dark"><span>Total</span><span>Rs. {total.toLocaleString()}</span></div>

              {requiresAdvance && (
                <div className="mt-2 pt-2 border-t border-sand-dark flex flex-col gap-1">
                  <div className="flex justify-between text-gold-dark font-medium"><span>Advance (now)</span><span>Rs. {ADVANCE_AMOUNT.toLocaleString()}</span></div>
                  <div className="flex justify-between text-ink/60"><span>On delivery</span><span>Rs. {codAmount.toLocaleString()}</span></div>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
