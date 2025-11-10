import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});



// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Contacts API
export const contactsAPI = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 10, search = '', status = '' } = params;
    const response = await api.get('/contacts', {
      params: { page, limit, search, status }
    });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/contacts', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/contacts/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/contacts/stats/overview');
    return response.data;
  },
};

// Deals API
export const dealsAPI = {
  getAll: async () => {
    const response = await api.get('/deals');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/deals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/deals/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  },
};
export const tasksAPI = {
  getAll: async ({ page = 1, limit = 10, status = '', priority = '' } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    if (priority) params.priority = priority;

    const response = await api.get('/tasks', { params });
    return response.data; // returns { tasks: [...], pagination: {...} }
  },

  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data) => {
    // Ensure numbers are sent as numbers
    const payload = {
      ...data,
      assigned_to: data.assigned_to ? parseInt(data.assigned_to) : null,
      related_id: data.related_id ? parseInt(data.related_id) : null
    };

    const response = await api.post('/tasks', payload);
    return response.data;
  },

  update: async (id, data) => {
    const payload = {
      ...data,
      assigned_to: data.assigned_to ? parseInt(data.assigned_to) : null,
      related_id: data.related_id ? parseInt(data.related_id) : null
    };

    const response = await api.put(`/tasks/${id}`, payload);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};

export const reportsAPI = {
  getKPIs: async (period = 'month') => {
    const response = await api.get('/reports/kpis', {
      params: { period }
    });
    return response.data;
  },
  getForecast: async (months = 3) => {
    const response = await api.get('/reports/forecast', {
      params: { months }
    });
    return response.data;
  },
  getInsights: async (filters = {}) => {
    const response = await api.get('/reports/insights', {
      params: filters
    });
    return response.data;
  },
  exportDeals: async () => {
    const response = await api.get('/reports/export/deals');
    return response.data;
  },
  // Keep these for backward compatibility, but map to actual endpoints
  getDashboard: async () => {
    // Use kpis endpoint as dashboard data
    const response = await api.get('/reports/kpis', {
      params: { period: 'month' }
    });
    return response.data;
  },
  getSales: async () => {
    // Use forecast endpoint as sales data
    const response = await api.get('/reports/forecast', {
      params: { months: 3 }
    });
    return response.data;
  }
};

// Pipeline API
export const pipelineAPI = {
  getStages: async () => {
    const response = await api.get('/pipeline/stages');
    return response.data;
  },
  updateStage: async (dealId, stageId) => {
    const response = await api.put(`/pipeline/deals/${dealId}/stage`, { stageId });
    return response.data;
  },
};

// Team API
export const teamAPI = {
  getAll: async () => {
    const response = await api.get('/team');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/team/${id}`);
    return response.data;
  },
};

export default api;