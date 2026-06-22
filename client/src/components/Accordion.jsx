import { useState } from 'react';

export default function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!items.length) return null;

  return (
    <div className="flex flex-col divide-y divide-sand-dark border-t border-b border-sand-dark">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item._id || i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-ink">{item.question}</span>
              <span className={`text-ink/40 transition-transform flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>+</span>
            </button>
            {isOpen && <p className="text-sm text-ink/60 pb-4 pr-8 leading-relaxed">{item.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}
