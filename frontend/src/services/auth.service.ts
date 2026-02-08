import axios from 'axios';

const getBaseUrl = () => {
    // 🚨 FORCE CORRECT BACKEND URL IN PRODUCTION
    // This bypasses any incorrect VITE_API_URL in Render settings
    if (import.meta.env.PROD) {
        console.log('🔒 Using Hardcoded Production Backend URL');
        return 'https://technical-assistant.onrender.com/api';
    }

    let url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.endsWith('/api')) url += '/api';
    return url;
};

const API_BASE_URL = getBaseUrl();

console.log('🔗 API Base URL configured to:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// إضافة interceptor لإضافة التوكن لكل طلب
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (employee_id: string, password: string) => {
        const response = await api.post('/auth/login', { employee_id, password });
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },

    register: async (data: any) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setSelectedEquipment: (equipment: any) => {
        localStorage.setItem('selectedEquipment', JSON.stringify(equipment));
    },

    getSelectedEquipment: () => {
        const equipment = localStorage.getItem('selectedEquipment');
        return equipment ? JSON.parse(equipment) : null;
    },

    clearSelectedEquipment: () => {
        localStorage.removeItem('selectedEquipment');
    }
};

export default api;
