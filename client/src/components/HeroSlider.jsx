import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SLIDES = [
  {
    id: 1,
    image: '/banner.jpeg',    
  },
  {
    id: 2,
    image: '/banner2.jpeg',

  },
  {
    id: 3,
    image: '/banner3.jpeg',
   
  }
];

export default function HeroSlider({ slides = DEFAULT_SLIDES, autoPlayMs = 4500 }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Touch swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const go = useCallback((index) => {
    if (animating) return;
    const next = (index + slides.length) % slides.length;
    setAnimating(true);
    setCurrent(next);
    setTimeout(() => setAnimating(false), 600);
  }, [animating, slides.length]);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, autoPlayMs);
    return () => clearInterval(timerRef.current);
  }, [next, autoPlayMs, paused]);

  // Touch handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 60) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ aspectRatio: '16/7', minHeight: '260px', maxHeight: '540px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {/* Background image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
            style={{ transform: i === current ? 'scale(1.03)' : 'scale(1)', transition: 'transform 5s ease' }}
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay || 'from-ink/60 to-transparent'}`} />

          {/* Content */}
          <Link to={slide.cta?.href || '/shop'} className="absolute inset-0 flex items-end pb-10 md:pb-16 px-8 md:px-16">
            <div
              className="max-w-lg"
              style={{
                opacity: i === current ? 1 : 0,
                transform: i === current ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s'
              }}
            >
              {slide.tag && (
                <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-sm">
                  {slide.tag}
                </span>
              )}
              <h2 className="font-display text-2xl md:text-4xl text-paper leading-tight mb-3">{slide.title}</h2>
              {slide.subtitle && (
                <p className="text-paper/75 text-sm md:text-base mb-5 leading-relaxed">{slide.subtitle}</p>
              )}
              {slide.cta && (
                <span className="inline-block bg-gold text-paper text-sm font-semibold px-5 py-2.5 rounded-sm hover:bg-gold-dark transition-colors">
                  {slide.cta.label}
                </span>
              )}
            </div>
          </Link>
        </div>
      ))}

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-paper/20 hover:bg-paper/40 text-paper flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-paper/20 hover:bg-paper/40 text-paper flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Dot navigation */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px',
              background: i === current ? '#B8860B' : 'rgba(255,255,255,0.5)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
