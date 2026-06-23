import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const bannerSlides = [
  { image: '/banner.jpeg' },
  { image: '/banner2.jpeg' },
  { image: '/banner3.jpeg' }
];

const bannerText = {
  title: 'Premium Kitchen Essentials',
  subtitle: 'Thoughtfully designed kitchen accessories, made to last.',
  cta: 'Shop Now',
  ctaUrl: '/shop'
};

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

  return (
    <div>
      {/* Banner / Slider */}
      <section className="relative overflow-hidden bg-cream">
        <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
          <img
            src={bannerSlides[current].image}
            alt="Banner"
            className="w-full object-cover max-h-[520px]"
          />
        </div>

        {/* Prev Button */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
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
            />
          ))}
        </div>
      </section>

      {/* Static Text Below Banner */}
      <div className="bg-cream px-6 py-10 flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-widest text-gold font-medium mb-2">Aura Avenue</p>
        <h1 className="font-display text-3xl md:text-5xl text-gray-900 mb-4">{bannerText.title}</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-6 text-sm">{bannerText.subtitle}</p>
        <Link to={bannerText.ctaUrl}>
          <Button variant="gold">{bannerText.cta}</Button>
        </Link>
      </div>
    </div>
  );
}