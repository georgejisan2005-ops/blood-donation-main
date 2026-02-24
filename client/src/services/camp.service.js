import { api } from '../utils/api';

export const campService = {
    // Get all camps (public)
    getCamps: async (params) => {
        const response = await api.get('/camps', { params });
        return response.data;
    },

    // Get upcoming camps (public)
    getUpcomingCamps: async (limit = 5) => {
        const response = await api.get('/camps/upcoming', { params: { limit } });
        return response.data;
    },

    // Get specific camp details
    getCamp: async (id) => {
        const response = await api.get(`/camps/${id}`);
        return response.data;
    },

    // Create new camp (admin)
    createCamp: async (data) => {
        const response = await api.post('/camps', data);
        return response.data;
    },

    // Update camp (admin)
    updateCamp: async (id, data) => {
        const response = await api.patch(`/camps/${id}`, data);
        return response.data;
    },

    // Delete camp (admin)
    deleteCamp: async (id) => {
        const response = await api.delete(`/camps/${id}`);
        return response.data;
    },

    // Register for camp (donor)
    registerForCamp: async (id, data) => {
        const response = await api.post(`/camps/${id}/register`, data);
        return response.data;
    },

    // Unregister from camp (donor)
    unregisterFromCamp: async (id) => {
        const response = await api.delete(`/camps/${id}/register`);
        return response.data;
    }
};
