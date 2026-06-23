import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const faqs = [
  { q: 'How do I place an order?', a: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to enter your shipping address and choose a payment method.' },
  { q: 'What payment methods do you accept?', a: 'We accept JazzCash, Easypaisa, Bank Transfer, and Cash on Delivery. An advance payment of PKR 300 is required for all methods except COD.' },
  { q: 'How long does delivery take?', a: 'We deliver across Pakistan in 2–5 business days depending on your city. Major cities like Karachi, Lahore, and Islamabad typically receive orders in 2–3 days.' },
  { q: 'Can I return a product?', a: 'Yes! We offer hassle-free returns within 7 days of delivery. The product must be unused and in its original packaging. Contact us on WhatsApp to initiate a return.' },
  { q: 'How do I track my order?', a: 'Once your order is shipped, you\'ll receive a notification. You can also check your order status by going to My Account → Orders.' },
  { q: 'What is the advance payment for?', a: 'A small advance payment of PKR 300 helps us confirm serious orders and reduce fake orders. The remaining amount is collected on delivery.' },
  { q: 'My payment was sent but order not confirmed?', a: 'Please send your transaction ID/screenshot to our WhatsApp. Our team manually verifies payments and will confirm your order within a few hours.' },
  { q: 'Do you deliver outside Pakistan?', a: 'Currently, we only deliver within Pakistan. International shipping is something we\'re working towards.' }
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-sand-dark last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium text-ink hover:text-gold-dark transition-colors"
      >
        <span>{q}</span>
        <span className={`text-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <p className="pb-4 text-sm text-ink/65 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function Help() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="font-display text-4xl text-ink mb-3">Help & Support</h1>
          <p className="text-ink/60">We're here to help. Reach out anytime.</p>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          
            href="https://wa.me/923255910645?text=Hi!%20I%20need%20help%20with%20my%20order%20on%20Aura%20Avenue."
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center gap-3 p-6 rounded-sm border border-sand-dark hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <p className="font-medium text-ink text-sm">WhatsApp</p>
              <p className="text-xs text-ink/50 mt-0.5">Fastest response</p>
              <p className="text-xs text-[#25D366] font-medium mt-1">Chat Now →</p>
            </div>
          </a>

          
            href="mailto:auraevenue@gmail.com"
            className="flex flex-col items-center text-center gap-3 p-6 rounded-sm border border-sand-dark hover:border-gold transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              ✉️
            </div>
            <div>
              <p className="font-medium text-ink text-sm">Email</p>
              <p className="text-xs text-ink/50 mt-0.5">auraevenue@gmail.com</p>
              <p className="text-xs text-gold-dark font-medium mt-1">Send Email →</p>
            </div>
          </a>

          <div className="flex flex-col items-center text-center gap-3 p-6 rounded-sm border border-sand-dark">
            <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-2xl">
              🕐
            </div>
            <div>
              <p className="font-medium text-ink text-sm">Support Hours</p>
              <p className="text-xs text-ink/50 mt-0.5">Mon – Sat</p>
              <p className="text-xs text-ink/70 font-medium mt-1">10:00 AM – 8:00 PM</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-display text-2xl text-ink mb-6">Frequently Asked Questions</h2>
          <div className="bg-white border border-sand-dark rounded-sm px-6">
            {faqs.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* Still need help */}
        <div className="mt-12 text-center p-8 bg-cream border border-sand-dark rounded-sm">
          <p className="font-display text-xl text-ink mb-2">Still need help?</p>
          <p className="text-sm text-ink/60 mb-4">Our team is available on WhatsApp for quick support.</p>
          
            href="https://wa.me/923255910645"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#1ebe5d] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
