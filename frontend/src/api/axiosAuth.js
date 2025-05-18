import axios from 'axios';
import Cookies from 'js-cookie';

const axiosAuth = axios.create({
  baseURL: import.meta.env.VITE_API_BACKEND,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosAuth.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;