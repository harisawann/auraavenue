import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

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

export default function HeroSlider() {
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
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % bannerSlides.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  const slide = bannerSlides[current];

  return (
    <section className="relative overflow-hidden bg-cream">
      <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        <img src={slide.image} alt={slide.title} className="w-full object-cover max-h-[520px]" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease 0.1s' }}>
        <p className="text-xs uppercase tracking-widest text-gold font-medium mb-2">Aura Avenue</p>
        <h1 className="font-display text-3xl md:text-5xl text-white mb-4 drop-shadow-md">{slide.title}</h1>
        <p className="text-white/80 max-w-md mx-auto mb-6 text-sm">{slide.subtitle}</p>
        <Link to={slide.ctaUrl}>
          <Button variant="gold">{slide.cta}</Button>
        </Link>
      </div>

      <button onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {bannerSlides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-200 ${i === current ? 'bg-white w-5' : 'bg-white/50 w-2'}`} />
        ))}
      </div>
    </section>
  );
}