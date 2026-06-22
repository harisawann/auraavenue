const variants = {
  primary: 'bg-ink text-paper hover:bg-gold-dark',
  secondary: 'bg-transparent text-ink border border-ink/20 hover:border-ink',
  ghost: 'bg-transparent text-ink hover:bg-sand',
  gold: 'bg-gold text-paper hover:bg-gold-dark'
};

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-3 rounded-sm text-sm font-medium tracking-wide
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
