import api from '../../../api/axios';

export const RoomsService = {
  async listRooms() {
    const response = await api.get('/rooms');
    return response.data;
  },

  async createRoom(data) {
    const response = await api.post('/rooms', data);
    return response.data;
  },

  async getRoom(id) {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  async updateRoom(id, data) {
    const response = await api.patch(`/rooms/${id}`, data);
    return response.data;
  },

  async updateRoomPhoto(id, slot, formData) {
    const response = await api.post(`/rooms/${id}/photos/${slot}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async removeRoomPhoto(id, slot) {
    const response = await api.delete(`/rooms/${id}/photos/${slot}`);
    return response.data;
  },

  async deleteRoom(id) {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  }
};
