import { useEffect } from 'react';

const SITE_NAME = 'Aura Avenue';
const DEFAULT_DESCRIPTION = 'Aura Avenue — premium kitchen accessories, delivered across Pakistan.';

const setMetaTag = (attr, key, content) => {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

/**
 * Sets the page <title>, meta description, and Open Graph/Twitter tags for
 * the current route. Call once near the top of a page component.
 *
 * useSEO({ title: 'Shop', description: '...', image: 'https://...' })
 */
export function useSEO({ title, description = DEFAULT_DESCRIPTION, image, url, type = 'website' } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Premium Kitchen Accessories`;
    document.title = fullTitle;

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    if (url) setMetaTag('property', 'og:url', url);
    if (image) {
      setMetaTag('property', 'og:image', image);
      setMetaTag('name', 'twitter:image', image);
    }
    setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);

    // Reset to sensible defaults when the page unmounts, so navigating to a
    // route without its own useSEO call doesn't keep a stale title/og:image.
    return () => {
      document.title = `${SITE_NAME} | Premium Kitchen Accessories`;
    };
  }, [title, description, image, url, type]);
}
