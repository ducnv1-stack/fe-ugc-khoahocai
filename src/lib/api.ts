import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header cho mỗi request
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('csms_access_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor để xử lý lỗi 401 (Hết hạn token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi là 401 và chưa từng thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('csms_refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Gọi API refresh token
        // Lưu ý: Sử dụng axios trực tiếp thay vì instance 'api' để tránh lặp vô tận
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        // Lưu token mới
        localStorage.setItem('csms_access_token', data.access_token);
        localStorage.setItem('csms_refresh_token', data.refresh_token);

        // Cập nhật header và thực hiện lại request gốc
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu refresh cũng lỗi (hết hạn refresh token) -> Đăng xuất
        localStorage.removeItem('csms_access_token');
        localStorage.removeItem('csms_refresh_token');
        localStorage.removeItem('csms_user');
        
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
