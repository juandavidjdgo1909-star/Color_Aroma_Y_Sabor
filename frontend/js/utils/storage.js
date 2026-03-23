const API_URL = '/api';

const KEYS = {
  TOKEN: 'token',
  USER:  'user',
  CART:  'cart',
};

/* ── Auth ── */
export const getToken = () => localStorage.getItem(KEYS.TOKEN);

export const getUser = () => {
  const raw = localStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const setAuth = (token, user) => {
  localStorage.setItem(KEYS.TOKEN, token);
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.USER);
};

export const getCart = () => {
  const raw = localStorage.getItem(KEYS.CART);
  return raw ? JSON.parse(raw) : [];
};

export const setCart = (cart) => {
  localStorage.setItem(KEYS.CART, JSON.stringify(cart));
};

export const clearCart = () => {
  localStorage.removeItem(KEYS.CART);
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    clearAuth();
    window.location.href = 'index.html';
    return null;
  }

  return res.json();
};
