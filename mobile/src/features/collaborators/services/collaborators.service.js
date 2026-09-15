import api from '../../../api/axios';

export const CollaboratorsService = {
  async listCollaborators(roomId) {
    const response = await api.get(`/rooms/${roomId}/collaborators`);
    return response.data;
  },

  async createCollaborator(roomId, data) {
    const response = await api.post(`/rooms/${roomId}/collaborators`, data);
    return response.data;
  },

  async deleteCollaborator(roomId, id) {
    const response = await api.delete(`/rooms/${roomId}/collaborators/${id}`);
    return response.data;
  }
};
