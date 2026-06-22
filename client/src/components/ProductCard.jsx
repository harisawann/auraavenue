import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct =
    product.discountPercentage > 0
      ? product.discountPercentage
      : hasDiscount
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-sand rounded-sm mb-3">
        {product.images?.[0] ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-ink/30 text-sm">No image</div>
        )}

        {discountPct > 0 && (
          <span className="absolute top-3 left-3 bg-gold text-paper text-xs font-medium px-2 py-1 rounded-sm">
            -{discountPct}%
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-paper/85 flex items-center justify-center">
            <span className="text-xs uppercase tracking-wider font-medium text-ink/70">Out of stock</span>
          </div>
        )}
      </div>

      {product.category?.name && (
        <span className="text-xs uppercase tracking-wider text-ink/40">{product.category.name}</span>
      )}
      <h3 className="font-display text-base text-ink leading-snug mt-0.5 mb-1 group-hover:text-gold-dark transition-colors">
        {product.name}
      </h3>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink font-medium">Rs. {product.price.toLocaleString()}</span>
        {hasDiscount && (
          <span className="text-ink/40 line-through text-xs">Rs. {product.compareAtPrice.toLocaleString()}</span>
        )}
      </div>
      {product.ratingsCount > 0 && (
        <div className="flex items-center gap-1 mt-1 text-xs text-ink/50">
          <span>★ {product.ratingsAverage.toFixed(1)}</span>
          <span>({product.ratingsCount})</span>
        </div>
      )}
    </Link>
  );
}
