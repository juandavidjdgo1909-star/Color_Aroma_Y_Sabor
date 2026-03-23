import { fetchWithAuth } from '../utils/storage.js';

export const getMenu       = ()      => fetchWithAuth('/menu');
export const getAllDishes   = ()      => fetchWithAuth('/menu/all');
export const createDish    = (data)  => fetchWithAuth('/menu', { method: 'POST', body: JSON.stringify(data) });
export const updateDish    = (id, data) => fetchWithAuth(`/menu/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteDish    = (id)    => fetchWithAuth(`/menu/${id}`, { method: 'DELETE' });
