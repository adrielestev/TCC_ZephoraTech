import api from '../../../api/axios';

export const UsersService = {
  async updateMe(data) {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
  
  async updateMyPhoto(formData) {
    const response = await api.post('/users/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async removeMyPhoto() {
    const response = await api.delete('/users/me/photo');
    return response.data;
  },

  async listUsers() {
    const response = await api.get('/users');
    return response.data;
  },

  async updateUserLevel(id, data) {
    const response = await api.patch(`/users/${id}/level`, data);
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
