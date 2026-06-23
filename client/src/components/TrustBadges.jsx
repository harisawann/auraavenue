const badges = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Secure Checkout',
    description: 'Your data & payments are always protected.'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    title: 'Fast Delivery',
    description: 'Delivered across Pakistan in 2–5 days.'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
      </svg>
    ),
    title: 'Easy Returns',
    description: 'Hassle-free returns within 7 days.'
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    title: '24/7 Support',
    description: 'We\'re here to help via WhatsApp & email.'
  }
];

export default function TrustBadges() {
  return (
    <section className="border-y border-sand-dark bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {badges.map((badge) => (
          <div key={badge.title} className="flex flex-col items-center text-center gap-3 group">
            <div className="text-gold-dark group-hover:scale-110 transition-transform duration-200">
              {badge.icon}
            </div>
            <div>
              <p className="font-medium text-ink text-sm mb-0.5">{badge.title}</p>
              <p className="text-xs text-ink/55 leading-relaxed">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
