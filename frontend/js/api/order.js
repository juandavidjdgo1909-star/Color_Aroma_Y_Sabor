import { fetchWithAuth } from '../utils/storage.js';

export const getOrders   = ()              => fetchWithAuth('/order');
export const createOrder = (items, mesa)   => fetchWithAuth('/order', {
  method: 'POST',
  body: JSON.stringify({ items, mesa }),
});
export const updateOrder = (id, estado)    => fetchWithAuth(`/order/${id}`, {
  method: 'PATCH',
  body: JSON.stringify({ estado }),
});
