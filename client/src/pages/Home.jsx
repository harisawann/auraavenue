import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { faqService } from '../services/faqService';
import { homepageService } from '../services/homepageService';
import { reviewService } from '../services/reviewService';
import { useSEO } from '../hooks/useSEO';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TrustBadges from '../components/TrustBadges';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';
import Accordion from '../components/Accordion';
import Button from '../components/Button';

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`
      }}
    >
      {children}
    </div>
  );
}

function ProductRow({ title, products, viewAllHref, loading = false }) {
  if (!loading && products.length === 0) return null;
  return (
    <AnimatedSection>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-ink">{title}</h2>
          {viewAllHref && (
            <Link to={viewAllHref} className="text-sm text-ink/60 hover:text-ink transition-colors">
              View all
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p, i) => (
              <div key={p._id} className="hover-lift" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={p} />
              </div>
            ))
          }
        </div>
      </section>
    </AnimatedSection>
  );
}

// Banner slides data
const bannerSlides = [
  {
    image: '/banner.jpeg',
    title: 'Premium Kitchen Essentials',
    subtitle: 'Thoughtfully designed kitchen accessories, made to last.',
    cta: 'Shop Now',
    ctaUrl: '/shop'
  },
  {
    image: '/banner2.jpeg',
    title: 'Enter a Better Lifestyle',
    subtitle: 'Upgrade your kitchen with Aura Avenue collections.',
    cta: 'Explore',
    ctaUrl: '/shop'
  },
  {
    image: '/banner3.jpeg',
    title: 'Free Delivery Across Pakistan',
    subtitle: 'On orders above PKR 5,000. COD available everywhere.',
    cta: 'Start Shopping',
    ctaUrl: '/shop'
  }
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  const goTo = (index) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(index);
      setFade(true);
    }, 300);
  };

  const next = () => goTo((current + 1) % bannerSlides.length);
  const prev = () => goTo((current - 1 + bannerSlides.length) % bannerSlides.length);

  useEffect(() => {
  let imagesLoaded = 0;
  const total = bannerSlides.length;

  const startTimer = () => {
    if (timerRef.current) return; // prevent duplicate timers
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % bannerSlides.length);
        setFade(true);
      }, 300);
    }, 6000);
  };

  bannerSlides.forEach((slide) => {
    const img = new Image();
    img.onload = () => {
      imagesLoaded++;
      if (imagesLoaded === total) startTimer();
    };
    img.onerror = () => {
      imagesLoaded++;
      if (imagesLoaded === total) startTimer(); // start even if an image fails
    };
    if (img.complete) {
      // already cached
      imagesLoaded++;
      if (imagesLoaded === total) startTimer();
    } else {
      img.src = slide.src;
    }
    img.src = slide.image;
  });

  return () => clearInterval(timerRef.current);
}, []);

  return (
    <div>
      {/* Slider - image only, no text overlay */}
      <section className="relative overflow-hidden bg-cream">
        <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          <img
  key={bannerSlides[current].image}
  src={bannerSlides[current].image}
  alt={`Banner ${current + 1}`}
  className="w-full object-cover max-h-[520px]"
/>
        </div>

        {/* Prev Button */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-200 ${i === current ? 'bg-white w-5' : 'bg-white/50 w-2'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Static text below banner */}
      <div className="bg-cream px-6 py-10 flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-widest text-gold font-medium mb-2">Aura Avenue</p>
        <h1 className="font-display text-3xl md:text-5xl text-ink mb-4">Premium Kitchen Essentials</h1>
        <p className="text-ink/60 max-w-md mx-auto mb-6 text-sm">Thoughtfully designed kitchen accessories, made to last.</p>
        <Link to="/shop">
          <Button variant="gold">Shop Now</Button>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  useSEO({
    description: 'Shop premium kitchen accessories and homeware at Aura Avenue. COD, JazzCash & Easypaisa accepted, delivered across Pakistan.'
  });


  const [productsLoading, setProductsLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      homepageService.getSections().catch(() => ({ sections: [] })),
      productService.getFeaturedProducts(8).catch(() => ({ products: [] })),
      productService.getNewArrivals(8).catch(() => ({ products: [] })),
      productService.getBestSellers(8).catch(() => ({ products: [] })),
      faqService.getFAQs().catch(() => ({ faqs: [] }))
    ]).then(([sectionsData, featuredData, newArrivalsData, bestSellersData, faqData]) => {
      if (cancelled) return;      
      setProductsLoading(false);
      setFeatured(featuredData.products);
      setNewArrivals(newArrivalsData.products);
      setBestSellers(bestSellersData.products);
      setFaqs(faqData.faqs);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (bestSellers.length === 0) return undefined;
    let cancelled = false;
    Promise.all(bestSellers.slice(0, 3).map((p) => reviewService.getProductReviews(p._id).catch(() => ({ reviews: [] })))).then(
      (results) => {
        if (cancelled) return;
        const allReviews = results.flatMap((r) => r.reviews).filter((r) => r.comment);
        setReviews(allReviews.slice(0, 6));
      }
    );
    return () => { cancelled = true; };
  }, [bestSellers]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      setNewsletterEmail('');
      toast.success("Thanks for subscribing! We'll keep you updated.");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      {/* Hero Banner Slider */}
      <HeroBanner />

      <AnimatedSection delay={0.05}>
        <TrustBadges />
      </AnimatedSection>

      <ProductRow title="Featured Products" products={featured} viewAllHref="/shop" loading={productsLoading} />
      <ProductRow title="New Arrivals" products={newArrivals} viewAllHref="/shop?sort=-createdAt" />
      <ProductRow title="Best Sellers" products={bestSellers} viewAllHref="/shop?sort=-ratingsAverage" />

      {/* Customer Reviews */}
      {reviews.length > 0 && (
        <AnimatedSection>
          <section className="bg-cream py-12">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="font-display text-2xl text-ink mb-6">What Our Customers Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((review, i) => (
                  <div key={review._id} className="bg-white border border-sand-dark rounded-sm p-5 hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="text-gold mb-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                    <p className="text-sm text-ink/70 mb-3">"{review.comment}"</p>
                    <p className="text-xs text-ink/40">{review.user?.name || 'Customer'}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <AnimatedSection>
          <section className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-display text-2xl text-ink mb-6 text-center">Frequently Asked Questions</h2>
            <Accordion items={faqs} />
          </section>
        </AnimatedSection>
      )}

      {/* Newsletter */}
      <AnimatedSection>
        <section className="bg-ink text-paper py-16">
          <div className="max-w-xl mx-auto px-6 text-center">
            <h2 className="font-display text-2xl mb-2">Join Our Newsletter</h2>
            <p className="text-paper/60 text-sm mb-6">Be the first to know about new arrivals and special offers.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-sm bg-paper/10 border border-paper/20 text-paper placeholder:text-paper/40 outline-none focus:border-gold transition-colors"
              />
              <Button type="submit" variant="gold" loading={subscribing}>Subscribe</Button>
            </form>
          </div>
        </section>
      </AnimatedSection>

      {/* Social */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="font-display text-2xl text-ink mb-2">Follow Us on Instagram</h2>
          <p className="text-sm text-ink/60 mb-8">@aura.avenue25</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <a key={i} href="https://www.instagram.com/aura.avenue25" target="_blank" rel="noopener noreferrer"
                className="aspect-square bg-sand rounded-sm flex items-center justify-center text-ink/20 hover:opacity-80 hover:scale-105 transition-all duration-200">
                📷
              </a>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <a href="https://www.instagram.com/aura.avenue25?igsh=dnQwaDM0OXV5YjJh&utm_source=qr" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-ink/60 hover:text-gold transition-colors border border-sand-dark px-4 py-2 rounded-sm hover:border-gold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Follow on Instagram
            </a>
            <a href="https://www.facebook.com/profile.php?id=61590865833865" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-ink/60 hover:text-gold transition-colors border border-sand-dark px-4 py-2 rounded-sm hover:border-gold">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Follow on Facebook
            </a>
          </div>
        </section>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
