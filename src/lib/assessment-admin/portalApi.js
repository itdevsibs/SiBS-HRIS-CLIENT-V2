import axios from 'axios';

const raw = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const baseURL = String(raw).trim().replace(/\/+$/, '').replace(/\/api$/, '');

// Intentionally bypass the main HRIS Axios instance and its logout/session cache.
// Authentication is provided by a different HttpOnly, path-scoped portal cookie.
const portalApi = axios.create({
  baseURL, withCredentials: true, timeout: 20000,
  headers: { 'X-SiBS-Assessment-Portal': '1' },
});

export default portalApi;
