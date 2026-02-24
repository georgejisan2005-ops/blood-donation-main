import { api } from '../utils/api';

export const donorService = {
    // Get donor profile
    getProfile: async () => {
        const response = await api.get('/donors/profile');
        return response.data;
    },

    // Create or update donor profile
    updateProfile: async (data) => {
        const response = await api.post('/donors/profile', data);
        return response.data;
    },

    // Update availability status
    updateAvailability: async (data) => {
        const response = await api.put('/donors/availability', data);
        return response.data;
    },

    // Get matching blood requests
    getRequests: async (params) => {
        const response = await api.get('/donors/requests', { params });
        return response.data;
    },

    // Get specific blood request details
    getRequest: async (id) => {
        const response = await api.get(`/donors/requests/${id}`);
        return response.data;
    },

    // Respond to a blood request
    respondToRequest: async (data) => {
        const response = await api.post('/donors/respond-request', data);
        return response.data;
    },

    // Get donation history
    getHistory: async (params) => {
        const response = await api.get('/donors/history', { params });
        return response.data;
    },

    // Get eligible donors (public)
    getEligibleDonors: async (params) => {
        const response = await api.get('/donors/eligible', { params });
        return response.data;
    }
};
