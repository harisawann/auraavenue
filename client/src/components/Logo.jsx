export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16'
  };

  return (
    <img
      src="/logo.jpeg"
      alt="Aura Avenue"
      className={`${sizes[size]} w-auto object-contain`}
    />
  );
}
