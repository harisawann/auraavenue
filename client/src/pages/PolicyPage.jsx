import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { shippingService } from '../services/shippingService';
import Header from '../components/Header';
import Footer from '../components/Footer';

const staticPolicies = {
  returns: {
    title: 'Return Policy',
    content: `We want you to love your Aura Avenue purchase. If something isn't right, you can return most items within 7 days of delivery, provided they are unused, in their original packaging, and accompanied by proof of purchase.

To start a return, please contact our customer support team with your order number and reason for return. Once approved, we'll guide you through the return process.

Note: For hygiene reasons, certain items (e.g. used cookware) may not be eligible for return unless defective.`
  },
  refunds: {
    title: 'Refund Policy',
    content: `Once we receive and inspect your returned item, we'll notify you of the approval or rejection of your refund.

If approved, your refund will be processed within 5-7 business days. For Cash on Delivery orders, refunds are issued via bank transfer; for JazzCash, Easypaisa, or Bank Transfer payments, refunds are returned to the original payment method where possible.

Shipping charges are non-refundable unless the return is due to our error (e.g. wrong or defective item shipped).`
  }
};

export default function PolicyPage() {
  const { policy } = useParams(); // 'shipping' | 'returns' | 'refunds'
  const [shippingPolicyText, setShippingPolicyText] = useState('');

  useEffect(() => {
    if (policy === 'shipping') {
      shippingService
        .getConfig()
        .then((data) => setShippingPolicyText(data.config.shippingPolicyText))
        .catch(() => {});
    }
  }, [policy]);

  const isShipping = policy === 'shipping';
  const content = isShipping ? shippingPolicyText : staticPolicies[policy]?.content;
  const title = isShipping ? 'Shipping Policy' : staticPolicies[policy]?.title;

  if (!title) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl text-ink mb-2">Page not found</p>
          <Link to="/" className="text-sm text-gold-dark hover:underline">
            Return home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl text-ink mb-6">{title}</h1>
        <div className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">
          {content || 'This policy will be available shortly.'}
        </div>
      </main>
      <Footer />
    </div>
  );
}
