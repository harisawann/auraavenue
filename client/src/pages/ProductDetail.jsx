import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { faqService } from '../services/faqService';
import { reviewService } from '../services/reviewService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { addRecentlyViewed, getRecentlyViewed } from '../utils/recentlyViewed';
import Header from '../components/Header';
import Button from '../components/Button';
import Accordion from '../components/Accordion';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { useSEO } from '../hooks/useSEO';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeMediaType, setActiveMediaType] = useState('image'); // 'image' | 'video'

  const [faqs, setFaqs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useSEO(
    product
      ? {
          title: product.name,
          description: product.description?.slice(0, 160),
          image: product.images?.[0]?.url,
          type: 'product'
        }
      : {}
  );

  useEffect(() => {
    let cancelled = false;

    productService
      .getProductBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setProduct(data.product);
        setActiveMediaIndex(0);
        setActiveMediaType('image');
        setQuantity(1);
        addRecentlyViewed(slug);
      })
      .catch((err) => {
        if (cancelled) return;
        const is404 = err.response?.status === 404;
        if (!is404) toast.error('Could not load this product.');
        setNotFound(is404);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!product) return undefined;
    let cancelled = false;

    Promise.all([
      faqService.getFAQs(product._id).catch(() => ({ faqs: [] })),
      reviewService.getProductReviews(product._id).catch(() => ({ reviews: [] })),
      productService.getRelatedProducts(slug).catch(() => ({ products: [] }))
    ]).then(([faqData, reviewData, relatedData]) => {
      if (cancelled) return;
      setFaqs(faqData.faqs);
      setReviews(reviewData.reviews);
      setRelatedProducts(relatedData.products);
    });

    // Recently viewed needs each product's current data (price/image), so
    // we look them up individually rather than trusting stale localStorage data.
    const recentSlugs = getRecentlyViewed().filter((s) => s !== slug).slice(0, 4);
    Promise.all(recentSlugs.map((s) => productService.getProductBySlug(s).catch(() => null))).then((results) => {
      if (!cancelled) setRecentlyViewedProducts(results.filter(Boolean).map((r) => r.product));
    });

    return () => {
      cancelled = true;
    };
  }, [product, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-sand rounded-sm" />
          <div className="space-y-4">
            <div className="h-8 bg-sand rounded-sm w-2/3" />
            <div className="h-5 bg-sand rounded-sm w-1/4" />
            <div className="h-24 bg-sand rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="font-display text-2xl text-ink mb-2">We couldn't find that product</p>
          <p className="text-sm text-ink/60 mb-6">It may have sold out or been removed.</p>
          <Link to="/shop">
            <Button variant="secondary">Back to shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct =
    product.discountPercentage > 0
      ? product.discountPercentage
      : hasDiscount
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;
  const outOfStock = product.stock === 0;
  const wishlisted = isWishlisted(product._id);

  const deliveryMin = product.estimatedDeliveryDays?.min ?? 3;
  const deliveryMax = product.estimatedDeliveryDays?.max ?? 7;
  const deliveryDate = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const mediaItems = [
    ...(product.images || []).map((img) => ({ type: 'image', ...img })),
    ...(product.videos || []).map((vid) => ({ type: 'video', ...vid }))
  ];
  const activeMedia = mediaItems.find(
    (m, i) => i === activeMediaIndex && m.type === activeMediaType
  ) || mediaItems[0];

  const requireAuth = (action) => {
    if (!isAuthenticated) {
      toast('Sign in to continue', { icon: '🔒' });
      navigate('/login', { state: { from: `/products/${slug}` } });
      return false;
    }
    return action;
  };

  const handleAddToCart = async () => {
    if (!requireAuth(true)) return;
    setAddingToCart(true);
    const result = await addItem(product._id, quantity);
    setAddingToCart(false);
    if (result.success) toast.success(`Added ${quantity} to cart`);
    else toast.error(result.message);
  };

  const handleBuyNow = async () => {
    if (!requireAuth(true)) return;
    setBuyingNow(true);
    const result = await addItem(product._id, quantity);
    setBuyingNow(false);
    if (result.success) navigate('/checkout');
    else toast.error(result.message);
  };

  const handleToggleWishlist = async () => {
    if (!requireAuth(true)) return;
    const result = await toggleWishlist(product._id);
    if (result.success) toast.success(result.added ? 'Added to wishlist' : 'Removed from wishlist');
    else toast.error(result.message || 'Could not update wishlist');
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
      return;
    }
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${product.name} ${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!requireAuth(true)) return;
    setSubmittingReview(true);
    try {
      const data = await reviewService.createReview(product._id, reviewRating, reviewTitle, reviewComment);
      setReviews((prev) => [data.review, ...prev]);
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <Link to="/shop" className="text-sm text-ink/60 hover:text-ink transition-colors">
          ← Back to shop
        </Link>

        <div className="grid md:grid-cols-2 gap-10 mt-6">
          {/* Media gallery */}
          <div>
            <div className="aspect-square overflow-hidden bg-sand rounded-sm mb-3">
              {activeMedia?.type === 'video' ? (
                <video src={activeMedia.url} controls className="h-full w-full object-cover" poster={activeMedia.thumbnailUrl} />
              ) : activeMedia ? (
                <img src={activeMedia.url} alt={activeMedia.alt || product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-ink/30">No image</div>
              )}
            </div>
            {mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {mediaItems.map((media, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveMediaIndex(i);
                      setActiveMediaType(media.type);
                    }}
                    className={`relative h-16 w-16 flex-shrink-0 rounded-sm overflow-hidden border-2 transition-colors ${
                      i === activeMediaIndex ? 'border-gold' : 'border-transparent'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <>
                        <img src={media.thumbnailUrl || media.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/20 text-paper text-xs">▶</span>
                      </>
                    ) : (
                      <img src={media.url} alt={media.alt || ''} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              {product.category?.name && (
                <span className="text-xs uppercase tracking-wider text-ink/50">{product.category.name}</span>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleShare('whatsapp')} className="text-ink/40 hover:text-ink text-sm" aria-label="Share on WhatsApp">
                  WhatsApp
                </button>
                <button onClick={() => handleShare('facebook')} className="text-ink/40 hover:text-ink text-sm" aria-label="Share on Facebook">
                  Facebook
                </button>
                <button onClick={() => handleShare('copy')} className="text-ink/40 hover:text-ink text-sm" aria-label="Copy link">
                  Copy link
                </button>
              </div>
            </div>

            <h1 className="font-display text-3xl text-ink mb-3 mt-1">{product.name}</h1>

            <div className="flex items-center gap-3 mb-1">
              <span className="font-display text-2xl text-ink">Rs. {product.price.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-ink/40 line-through text-lg">Rs. {product.compareAtPrice.toLocaleString()}</span>
                  <span className="bg-gold/15 text-gold-dark text-xs font-medium px-2 py-1 rounded-sm">-{discountPct}%</span>
                </>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-4 text-sm text-ink/60">
                <StarRating value={product.ratingsAverage} size="sm" />
                <span>
                  {product.ratingsAverage.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            <p className="text-ink/70 leading-relaxed mb-4 whitespace-pre-line">{product.description}</p>

            {product.features?.length > 0 && (
              <ul className="flex flex-col gap-1.5 mb-4">
                {product.features.map((feature, i) => (
                  <li key={i} className="text-sm text-ink/70 flex items-start gap-2">
                    <span className="text-gold mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-1 text-sm text-ink/60 mb-4">
              <span>
                {outOfStock ? (
                  <span className="font-medium text-error">Currently out of stock</span>
                ) : (
                  `${product.stock} in stock`
                )}
              </span>
              <span>Country of origin: {product.countryOfOrigin}</span>
              {!outOfStock && (
                <span>
                  Estimated delivery: {deliveryDate(deliveryMin)} – {deliveryDate(deliveryMax)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-sand-dark">
              {!outOfStock && (
                <div className="flex items-center border border-sand-dark rounded-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-ink/60 hover:text-ink"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-3 text-sm w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 text-ink/60 hover:text-ink"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                onClick={handleToggleWishlist}
                className={`px-3 py-2 border rounded-sm transition-colors ${
                  wishlisted ? 'border-gold text-gold' : 'border-sand-dark text-ink/50 hover:text-ink'
                }`}
                aria-label="Toggle wishlist"
              >
                {wishlisted ? '♥' : '♡'}
              </button>
            </div>

            <div className="flex gap-3 mt-3">
              <Button disabled={outOfStock} loading={addingToCart} variant="secondary" className="flex-1" onClick={handleAddToCart}>
                {outOfStock ? 'Out of stock' : 'Add to cart'}
              </Button>
              <Button disabled={outOfStock} loading={buyingNow} className="flex-1" onClick={handleBuyNow}>
                Buy now
              </Button>
            </div>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications?.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl text-ink mb-4">Specifications</h2>
            <div className="border border-sand-dark rounded-sm divide-y divide-sand-dark max-w-2xl">
              {product.specifications.map((spec, i) => (
                <div key={i} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-ink/60">{spec.label}</span>
                  <span className="text-ink font-medium">{spec.value}</span>
                </div>
              ))}
              {product.dimensions && (product.dimensions.length || product.dimensions.weight) && (
                <div className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-ink/60">Dimensions</span>
                  <span className="text-ink font-medium">
                    {product.dimensions.length && `${product.dimensions.length}×${product.dimensions.width}×${product.dimensions.height} ${product.dimensions.unit}`}
                    {product.dimensions.weight && ` · ${product.dimensions.weight}${product.dimensions.weightUnit}`}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="mt-16 max-w-2xl">
            <h2 className="font-display text-2xl text-ink mb-4">Frequently Asked Questions</h2>
            <Accordion items={faqs} />
          </section>
        )}

        {/* Reviews */}
        <section className="mt-16 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-ink">Customer Reviews</h2>
            {isAuthenticated && !showReviewForm && (
              <Button variant="secondary" onClick={() => setShowReviewForm(true)}>
                Write a review
              </Button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-white border border-sand-dark rounded-sm p-5 mb-6 flex flex-col gap-3">
              <StarRating value={reviewRating} interactive onChange={setReviewRating} size="lg" />
              <input
                type="text"
                placeholder="Review title (optional)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="px-3 py-2 text-sm rounded-sm border border-sand-dark outline-none focus:border-ink"
              />
              <textarea
                placeholder="Share your thoughts about this product..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="px-3 py-2 text-sm rounded-sm border border-sand-dark outline-none focus:border-ink resize-none"
              />
              <div className="flex gap-2">
                <Button type="submit" loading={submittingReview}>
                  Submit review
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-ink/50">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-sand-dark pb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating value={review.rating} size="sm" />
                    {review.isVerifiedPurchase && (
                      <span className="text-xs text-success">Verified Purchase</span>
                    )}
                  </div>
                  {review.title && <p className="font-medium text-ink text-sm">{review.title}</p>}
                  {review.comment && <p className="text-sm text-ink/70 mt-1">{review.comment}</p>}
                  <p className="text-xs text-ink/40 mt-2">
                    {review.user?.name || 'Anonymous'} ·{' '}
                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl text-ink mb-6">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl text-ink mb-6">Recently viewed</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {recentlyViewedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
