import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inkwell_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  signin: (data) => api.post('/auth/signin', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  myPosts: () => api.get('/auth/me/posts'),
  changeUsername: (data) => api.put('/auth/me/username', data),
  changePassword: (data) => api.put('/auth/me/password', data),
  sendOTP: (email) => api.post('/auth/otp/send', { email }),
  verifyOTP: (data) => api.post('/auth/otp/verify', data),
  sendVerifyEmail: (email) => api.post('/auth/otp/send-verify', { email }),
  checkVerifyEmail: (data) => api.post('/auth/otp/check-verify', data),
  getPublicProfile: (id) => api.get(`/auth/users/${id}`),
};

// Posts
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getOne: (id) => api.get(`/posts/${id}`),
  getCategories: () => api.get('/posts/categories'),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  getLikes: (id) => api.get(`/posts/${id}/likes`),
};

// Comments
export const commentsAPI = {
  getByPost: (post_id) => api.get('/comments', { params: { post_id } }),
  getAll: () => api.get('/comments/all'),
  create: (data) => api.post('/comments', data),
  updateStatus: (id, status) => api.put(`/comments/${id}/status`, { status }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};
export default api;
