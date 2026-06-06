import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

// Instance Axios avec token auto-injecté
const API = axios.create({ baseURL: API_URL });

API.interceptors.request.use((config) => {
    let token = localStorage.getItem('access');
    if (token) {
        token = token.trim().replace(/^"+|"+$/g, '');
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Intercepteur : rafraîchit le token si 401
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem('refresh');
                const res = await axios.post(`${API_URL}token/refresh/`, { refresh });
                localStorage.setItem('access', res.data.access);
                originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
                return API(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

// ── AUTH ──────────────────────────────────────────────────────────
// CORRECTION : utilise /api/signin/ qui retourne user + tokens
export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}signin/`, credentials);
    return response.data; // { access, refresh, user }
};

export const signupUser = async (userData) => {
    const response = await axios.post(`${API_URL}signup/`, userData);
    return response.data;
};

// ── ARTICLES ──────────────────────────────────────────────────────
export const getItems = async () => {
    const response = await API.get('items/');
    return response.data;
};

export const getItemById = async (id) => {
    const cleanId = parseInt(id, 10);
    if (isNaN(cleanId)) throw new Error(`ID invalide : ${id}`);
    const response = await API.get(`items/${cleanId}/`);
    return response.data;
};

export const createItem = async (itemData) => {
    const response = await API.post('items/', itemData);
    return response.data;
};

export const deleteItem = async (id) => {
    const response = await API.delete(`items/${id}/`);
    return response.data;
};

// ── MON ESPACE ────────────────────────────────────────────────────
export const getMySpaceData = async () => {
    const response = await API.get('myspace/');
    return response.data;
    // Retourne : { user, items, transactions_pending, transactions_completed }
};

// ── SYSTÈME DE TROC ───────────────────────────────────────────────
/**
 * Propose un troc
 * @param {Object} payload - { my_item: int, their_item: int, receiver: int }
 */
export const proposeSwap = async (payload) => {
    const response = await API.post('swaps/', payload);
    return response.data;
};

/**
 * Accepter ou refuser un troc
 * @param {number} swapId - ID du swap
 * @param {string} action - 'accepted' | 'rejected'
 */
export const respondToSwap = async (swapId, action) => {
    const response = await API.patch(`swaps/${swapId}/respond/`, { action });
    return response.data;
};

export const getMySwaps = async () => {
    const response = await API.get('swaps/mine/');
    return response.data;
};

// Helper : récupère l'user connecté depuis localStorage
export const getCurrentUser = () => {
    try {
        const stored = localStorage.getItem('user');
        if (stored && stored !== 'undefined') return JSON.parse(stored);
    } catch (e) { console.error(e); }
    return null;
};

// Helper : décode le JWT pour récupérer user_id
export const getTokenUserId = () => {
    try {
        const token = localStorage.getItem('access');
        if (!token) return null;
        const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.user_id || payload.id || null;
    } catch { return null; }
};

export const isAuthenticated = () => !!localStorage.getItem('access');

export default API;
