export default function StarRating({ value = 0, size = 'md', interactive = false, onChange }) {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
            star <= Math.round(value) ? 'text-gold' : 'text-sand-dark'
          }`}
          aria-label={interactive ? `Rate ${star} stars` : undefined}
        >
          ★
        </button>
      ))}
    </div>
  );
}
