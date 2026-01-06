const KEY = 'nj_cart_items';

export const getCart = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setCart = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: items.reduce((s, i) => s + i.qty, 0) } }));
  } catch {}
};

export const addToCart = (product) => {
  const items = getCart();
  const idx = items.findIndex((i) => i.id === product.id);
  if (idx >= 0) {
    items[idx].qty += 1;
  } else {
    items.push({ id: product.id, name: product.name || product.name_ar, price: Number(product.price || 0), image_url: product.image_url, qty: 1 });
  }
  setCart(items);
};

export const removeFromCart = (id) => {
  const items = getCart().filter((i) => i.id !== id);
  setCart(items);
};

export const updateQty = (id, qty) => {
  const items = getCart().map((i) => (i.id === id ? { ...i, qty } : i));
  setCart(items);
};