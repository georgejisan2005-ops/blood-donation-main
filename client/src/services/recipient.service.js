import { api } from '../utils/api';

export const recipientService = {
    // Create a new blood request
    createRequest: async (data) => {
        const response = await api.post('/recipients/request', data);
        return response.data;
    },

    // Get user's blood requests
    getMyRequests: async (params) => {
        const response = await api.get('/recipients/requests', { params });
        return response.data;
    },

    // Get specific request details
    getRequest: async (id) => {
        const response = await api.get(`/recipients/requests/${id}`);
        return response.data;
    },

    // Update blood request
    updateRequest: async (id, data) => {
        const response = await api.put(`/recipients/requests/${id}`, data);
        return response.data;
    },

    // Cancel blood request
    cancelRequest: async (id) => {
        const response = await api.delete(`/recipients/requests/${id}`);
        return response.data;
    },

    // Get available donors
    getAvailableDonors: async (params) => {
        const response = await api.get('/recipients/available-donors', { params });
        return response.data;
    },

    // Mark donation as completed
    completeDonation: async (data) => {
        const response = await api.post('/recipients/complete-donation', data);
        return response.data;
    }
};
