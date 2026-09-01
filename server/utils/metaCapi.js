const META_CAPI_URL = (pixelId) =>
  `https://graph.facebook.com/v18.0/${pixelId}/events`;

export async function sendCapiPurchaseEvent({
  orderId,
  totalPrice,
  currency = 'TND',
  items = [],
  userIp,
  userAgent,
  eventSourceUrl,
  pixelId,
  accessToken,
}) {
  if (!pixelId || !accessToken) return;

  const eventTime = Math.floor(Date.now() / 1000);

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: `purchase-${orderId}`,
        action_source: 'website',
        event_source_url: eventSourceUrl || '',
        user_data: {
          client_ip_address: userIp || '',
          client_user_agent: userAgent || '',
        },
        custom_data: {
          currency,
          value: parseFloat(totalPrice) || 0,
          content_ids: items.map((item) => String(item.product_id)),
          content_type: 'product',
          num_items: items.length,
        },
      },
    ],
  };

  try {
    const response = await fetch(META_CAPI_URL(pixelId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        access_token: accessToken,
      }),
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      console.error('Meta CAPI error:', result.error || response.statusText);
    }
  } catch (error) {
    console.error('Meta CAPI request failed:', error.message);
  }
}
