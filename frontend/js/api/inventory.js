import { fetchWithAuth } from '../utils/storage.js';

export const getInventory = () => fetchWithAuth('/inventory');
