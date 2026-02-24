import { api } from '../utils/api';

export const notificationService = {
    // Get notifications
    getNotifications: async (params) => {
        const response = await api.get('/notifications', { params });
        return response.data;
    },

    // Mark notification as read
    markAsRead: async (id) => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    // Delete notification
    deleteNotification: async (id) => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    // Get unread count
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    }
};
