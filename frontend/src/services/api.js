import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Event API ────────────────────────────────────────────────────────────────
export const fetchEvent = () => api.get('/event');

// ── OTP API ──────────────────────────────────────────────────────────────────
export const sendOTP = (email) => api.post('/send-otp', { email });
export const verifyOTP = (email, otp) => api.post('/verify-otp', { email, otp });

// ── Registration API ─────────────────────────────────────────────────────────
export const registerUser = (payload) => api.post('/register', payload);

export default api;
