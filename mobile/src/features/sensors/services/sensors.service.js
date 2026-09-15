import api from '../../../api/axios';

export const SensorsService = {
  async listSensors() {
    const response = await api.get('/sensors');
    return response.data;
  },

  async createSensor(data) {
    const response = await api.post('/sensors', data);
    return response.data;
  },

  async getSensor(id) {
    const response = await api.get(`/sensors/${id}`);
    return response.data;
  },

  async updateSensor(id, data) {
    const response = await api.patch(`/sensors/${id}`, data);
    return response.data;
  },

  async deleteSensor(id) {
    const response = await api.delete(`/sensors/${id}`);
    return response.data;
  },

  async commandSensor(id, data) {
    const response = await api.post(`/sensors/${id}/command`, data);
    return response.data;
  }
};
