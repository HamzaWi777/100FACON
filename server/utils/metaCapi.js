const META_CAPI_URL = (pixelId) =>
  `https://graph.facebook.com/v26.0/${pixelId}/events`;

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
  const value = parseFloat(totalPrice) || 0;
  const contentIds = [...new Set(items.map((item) => String(item.product_id)))];
  const numItems = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);

  const event = {
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
      value,
      currency,
      content_ids: contentIds,
      content_type: 'product',
      num_items: numItems,
    },
  };

  try {
    const response = await fetch(META_CAPI_URL(pixelId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [event],
        access_token: accessToken,
      }),
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      console.error('Meta CAPI error:', JSON.stringify(result.error || response.statusText));
    }
  } catch (error) {
    console.error('Meta CAPI request failed:', error.message);
  }
}
