const badges = [
  { icon: '🔒', title: 'Secure Checkout', description: 'Your payment information is always protected.' },
  { icon: '🚚', title: 'Fast Delivery', description: 'Quick, reliable delivery across Pakistan.' },
  { icon: '💬', title: 'Customer Support', description: "We're here to help with any questions." }
];

export default function TrustBadges() {
  return (
    <section className="border-y border-sand-dark bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {badges.map((badge) => (
          <div key={badge.title} className="flex items-center gap-4">
            <span className="text-2xl flex-shrink-0">{badge.icon}</span>
            <div>
              <p className="font-medium text-ink text-sm">{badge.title}</p>
              <p className="text-xs text-ink/60">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
