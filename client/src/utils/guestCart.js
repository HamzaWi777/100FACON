// Guest cart management using localStorage
const GUEST_CART_KEY = 'guestCart';
const GUEST_SESSION_ID_KEY = 'guestSessionId';

export function getOrCreateGuestSessionId() {
  let sessionId = localStorage.getItem(GUEST_SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(GUEST_SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export function getGuestCart() {
  const cart = localStorage.getItem(GUEST_CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

export function saveGuestCart(cartItems) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.removeItem(GUEST_SESSION_ID_KEY);
}

export function addToGuestCart(product, quantity = 1, size = '', color = '') {
  const cart = getGuestCart();
  
  // Check if item already exists
  const existingItem = cart.find(
    item => item.product_id === product.id && item.size === size && item.color === color
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: `guest_${product.id}_${Date.now()}`,
      product_id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      quantity,
      size,
      color,
    });
  }
  
  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(itemId, quantity) {
  const cart = getGuestCart();
  const item = cart.find(i => i.id === itemId);
  if (item) {
    if (quantity < 1) {
      // Remove item
      return removeFromGuestCart(itemId);
    }
    item.quantity = quantity;
    saveGuestCart(cart);
  }
  return cart;
}

export function removeFromGuestCart(itemId) {
  const cart = getGuestCart();
  const filtered = cart.filter(i => i.id !== itemId);
  saveGuestCart(filtered);
  return filtered;
}
