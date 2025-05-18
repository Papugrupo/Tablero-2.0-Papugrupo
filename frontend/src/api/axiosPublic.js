import axios from 'axios';

const axiosPublic = axios.create({
  baseURL: import.meta.env.VITE_API_BACKEND,
});

axiosPublic.interceptors.request.use(config => {
  if (['post', 'put', 'patch'].includes(config.method)) {
    config.headers['Content-Type'] = 'application/json';
  } else {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default axiosPublic;
