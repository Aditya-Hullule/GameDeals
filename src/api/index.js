const BACKEND_BASE = 'http://localhost:3000/api';

// --- CHEAPSHARK API (Proxied through Backend) ---
export const fetchDeals = async (options = {}) => {
  const { storeID, upperPrice, lowerPrice, sortBy = 'Deal Rating', title } = options;
  
  const params = new URLSearchParams();
  if (storeID) params.append('storeID', storeID);
  if (upperPrice) params.append('upperPrice', upperPrice);
  if (lowerPrice) params.append('lowerPrice', lowerPrice);
  if (sortBy) params.append('sortBy', sortBy);
  if (title) params.append('title', title);
  
  if (!title) params.append('onSale', '1');

  try {
    const response = await fetch(`${BACKEND_BASE}/deals?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch deals');
    return await response.json();
  } catch (error) {
    console.error("Error fetching deals:", error);
    return [];
  }
};

export const fetchStores = async () => {
  try {
    const response = await fetch('https://www.cheapshark.com/api/1.0/stores');
    if (!response.ok) throw new Error('Failed to fetch stores');
    return await response.json();
  } catch (error) {
    console.error("Error fetching stores:", error);
    return [];
  }
};

export const fetchAIInsights = async (title) => {
  const response = await fetch(`${BACKEND_BASE}/ai/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch AI insights');
  return data;
};

// --- BACKEND API (Auth & Lists) ---

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const login = async (username, password) => {
  const response = await fetch(`${BACKEND_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export const register = async (username, password) => {
  const response = await fetch(`${BACKEND_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export const getList = async (listName) => {
  const response = await fetch(`${BACKEND_BASE}/${listName}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch list');
  return await response.json();
};

export const addToList = async (listName, deal) => {
  const response = await fetch(`${BACKEND_BASE}/${listName}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(deal)
  });
  if (!response.ok) throw new Error('Failed to add to list');
  return await response.json();
};

export const removeFromList = async (listName, dealID) => {
  const response = await fetch(`${BACKEND_BASE}/${listName}/${encodeURIComponent(dealID)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to remove from list');
  return await response.json();
};
