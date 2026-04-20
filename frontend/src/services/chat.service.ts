import api from './api';

export const chatService = {
  getMessages: (applicationId: string, page = 1, limit = 50) =>
    api.get(`/chat/${applicationId}/messages`, { params: { page, limit } }),

  uploadFile: (applicationId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/chat/${applicationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
