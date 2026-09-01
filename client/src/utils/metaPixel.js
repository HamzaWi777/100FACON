let initialized = false;

export function initMetaPixel(pixelId) {
  if (initialized || typeof window === 'undefined' || !pixelId) return;
  initialized = true;

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

function fbq(...args) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

export function trackPageView(url) {
  fbq('track', 'PageView', { page_path: url });
}

export function trackViewContent({ id, name, price, currency = 'TND' }) {
  fbq('track', 'ViewContent', {
    content_ids: [String(id)],
    content_name: name,
    content_type: 'product',
    value: price,
    currency,
  });
}

export function trackAddToCart({ id, name, price, quantity = 1, currency = 'TND' }) {
  fbq('track', 'AddToCart', {
    content_ids: [String(id)],
    content_name: name,
    content_type: 'product',
    value: price * quantity,
    currency,
    num_items: quantity,
  });
}

export function trackInitiateCheckout({ value, currency = 'TND', contentIds = [], numItems = 0 }) {
  fbq('track', 'InitiateCheckout', {
    value,
    currency,
    content_ids: contentIds.map(String),
    num_items: numItems,
  });
}

export function trackPurchase({ orderId, value, currency = 'TND', contentIds = [], numItems = 0 }) {
  fbq('track', 'Purchase', {
    event_id: `purchase-${orderId}`,
    value,
    currency,
    content_ids: contentIds.map(String),
    num_items: numItems,
  });
}
