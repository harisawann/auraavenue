// Lightweight analytics wrapper for Google Analytics 4 (gtag.js) and Meta
// (Facebook) Pixel. Both are entirely opt-in: if the corresponding env var
// isn't set, the scripts never load and these functions become no-ops, so
// local/dev environments and Apple aren't burdened with extra requests.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

let initialized = false;

function loadGA() {
  if (!GA_ID || window.gtag) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false }); // we send page_views manually on route change
}

function loadFacebookPixel() {
  if (!FB_PIXEL_ID || window.fbq) return;

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', FB_PIXEL_ID);
}

/** Call once on app startup. Safe to call multiple times. */
export function initAnalytics() {
  if (initialized) return;
  initialized = true;
  loadGA();
  loadFacebookPixel();
}

/** Call on every route change. */
export function trackPageview(path) {
  if (window.gtag) window.gtag('event', 'page_view', { page_path: path });
  if (window.fbq) window.fbq('track', 'PageView');
}

/**
 * Fire a named event on whichever analytics tools are configured.
 * gaParams go to GA4 as the event params object; fbEventName (defaults to
 * the same name) goes to the Pixel as a standard or custom event.
 */
export function trackEvent(name, gaParams = {}, fbEventName = name) {
  if (window.gtag) window.gtag('event', name, gaParams);
  if (window.fbq) window.fbq('track', fbEventName, gaParams);
}
