// API Service for VirtualFit Backend

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper for API requests
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
};

// Auth API
export const authAPI = {
    login: async (email, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('outlet', JSON.stringify(data.outlet));
        }

        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('outlet');
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },

    isAuthenticated: () => {
        return !!getToken();
    },

    getOutlet: () => {
        const outlet = localStorage.getItem('outlet');
        return outlet ? JSON.parse(outlet) : null;
    }
};

// Outlets API
export const outletsAPI = {
    register: async (outletData) => {
        return apiRequest('/outlets', {
            method: 'POST',
            body: JSON.stringify(outletData),
        });
    },

    getAll: async () => {
        return apiRequest('/outlets');
    },

    getById: async (id) => {
        return apiRequest(`/outlets/${id}`);
    },

    update: async (id, data) => {
        return apiRequest(`/outlets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
};

// Products API
export const productsAPI = {
    getAll: async (outletId = null) => {
        const query = outletId ? `?outlet_id=${outletId}` : '';
        return apiRequest(`/products${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/products/${id}`);
    },

    create: async (productData) => {
        return apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return apiRequest(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    // For file upload, use FormData
    createWithImage: async (formData) => {
        const token = getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers,
            body: formData, // Don't set Content-Type for FormData
        });

        return response.json();
    }
};

export default { authAPI, outletsAPI, productsAPI };
