export default function Input({ label, error, id, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-ink/60">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-4 py-3 rounded-sm bg-paper
          border ${error ? 'border-error' : 'border-sand-dark'}
          text-ink placeholder:text-ink/35
          focus:border-ink transition-colors outline-none
        `}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
