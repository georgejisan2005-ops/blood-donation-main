import { api } from "../utils/api";

const DonationRequestService = {
  // Create a new donation verification request
  createRequest: async (data) => {
    const response = await api.post('/donation-requests', data);
    return response.data;
  },

  // Get logged-in donor's requests
  getMyRequests: async () => {
    const response = await api.get('/donation-requests/my-requests');
    return response.data;
  },

  // Get confirmed/verified donation history (could be different if we just want requests)
  // But typically the donor history API might be separate or we use this one.
  // We'll stick to requests for now.

  // Get all pending requests (Admin only)
  getPendingRequests: async () => {
    const response = await api.get('/donation-requests/pending');
    return response.data;
  },

  // Approve a donation request (Admin only)
  verifyRequest: async (id) => {
    const response = await api.put(`/donation-requests/${id}/verify`);
    return response.data;
  },

  // Reject a donation request (Admin only)
  rejectRequest: async (id, rejectionReason) => {
    const response = await api.put(`/donation-requests/${id}/reject`, { rejectionReason });
    return response.data;
  }
};

export default DonationRequestService;
