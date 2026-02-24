import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const adminApi = axios.create({
    baseURL: `${API_BASE}/admin`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Attach the admin token from localStorage to every request
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers['x-admin-key'] = token;
    return config;
});

// Auto-logout on 401
adminApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('admin_token');
            window.location.href = '/admin/login';
        }
        return Promise.reject(err);
    }
);

export const adminLogin = (password) => adminApi.post('/login', { password });
export const fetchAdminStats = () => adminApi.get('/stats');
export const fetchRegistrations = () => adminApi.get('/registrations');
export const deleteRegistration = (id) => adminApi.delete(`/registrations/${id}`);
export const fetchAdminEvent = () => adminApi.get('/event');
export const updateAdminEvent = (payload) => adminApi.put('/event', payload);

export default adminApi;
