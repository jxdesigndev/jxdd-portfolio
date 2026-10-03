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

    document.getElementById('btn-accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'granted');
      banner.style.display = 'none';
      initAnalytics();
    });

    document.getElementById('btn-decline').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'denied');
      banner.style.display = 'none';
    });
  }
});
