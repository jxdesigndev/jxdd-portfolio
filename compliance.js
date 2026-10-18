document.addEventListener("DOMContentLoaded", () => {
  // Cookie Consent logic
  const CONSENT_KEY = 'jx_cookie_consent';
  const consent = localStorage.getItem(CONSENT_KEY);

  const initAnalytics = () => {
    // Avoid double initialization
    if (document.getElementById('ga-script')) return;

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-LZPJ6876W0';
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){window.dataLayer.push(arguments);}
    window.gtag('js', new Date());
    window.gtag('config', 'G-LZPJ6876W0', {
      'anonymize_ip': true
    });
    console.log('[Compliance] Consent granted. Analytics initialized.');
  };

  if (consent === 'granted') {
    initAnalytics();
  } else if (!consent) {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-content">
        <p>This site uses cookies for error tracking and analytics. No PII is collected. 
        <a href="privacy.html" class="cookie-link">View Privacy Policy</a></p>
      </div>
      <div class="cookie-actions">
        <button id="btn-accept" class="btn btn-ghost btn-magnetic">ACCEPT</button>
        <button id="btn-decline" class="btn btn-ghost">DECLINE</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.body.classList.add('has-cookie-banner');

    const updateBannerHeight = () => {
      if (!banner || banner.style.display === 'none') {
        document.documentElement.style.setProperty('--cookie-banner-height', '0px');
        return;
      }
      const rect = banner.getBoundingClientRect();
      document.documentElement.style.setProperty('--cookie-banner-height', `${Math.round(rect.height)}px`);
    };

    updateBannerHeight();

    let resizeObserver = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateBannerHeight);
      resizeObserver.observe(banner);
    }
    window.addEventListener('resize', updateBannerHeight, { passive: true });

    const dismissBanner = (granted) => {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
      banner.style.display = 'none';
      document.body.classList.remove('has-cookie-banner');
      document.documentElement.style.setProperty('--cookie-banner-height', '0px');
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateBannerHeight);
      if (granted) initAnalytics();
    };

    document.getElementById('btn-accept').addEventListener('click', () => dismissBanner(true));
    document.getElementById('btn-decline').addEventListener('click', () => dismissBanner(false));
  }
});
