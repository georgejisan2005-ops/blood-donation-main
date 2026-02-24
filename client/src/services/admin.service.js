import { api } from '../utils/api';

export const adminService = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    // Get all users
    getUsers: async (params) => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    // Update user status
    updateUserStatus: async (id, isActive) => {
        const response = await api.put(`/admin/users/${id}/status`, { isActive });
        return response.data;
    },

    // Get all donors
    getDonors: async (params) => {
        const response = await api.get('/admin/donors', { params });
        return response.data;
    },

    // Verify donor
    verifyDonor: async (id, isVerified) => {
        const response = await api.put(`/admin/donors/${id}/verify`, { isVerified });
        return response.data;
    },

    // Get all requests
    getRequests: async (params) => {
        const response = await api.get('/admin/requests', { params });
        return response.data;
    },

    // Verify request
    verifyRequest: async (id, isVerified) => {
        const response = await api.put(`/admin/requests/${id}/verify`, { isVerified });
        return response.data;
    },

    // Send announcement
    sendAnnouncement: async (data) => {
        const response = await api.post('/admin/announcement', data);
        return response.data;
    },

    // Get analytics
    getAnalytics: async (period) => {
        const response = await api.get('/admin/analytics', { params: { period } });
        return response.data;
    }
};
