import api from '../../../api/axios';

export const AuthService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  async verifyEmail(data) {
    const response = await api.post('/auth/verify-email', data);
    return response.data;
  },

  async resendCode(data) {
    const response = await api.post('/auth/resend-code', data);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async forgotPassword(data) {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data) {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  }
};
