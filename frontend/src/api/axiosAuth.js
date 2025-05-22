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

axiosAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 405) {

      Cookies.remove('token');

      // Redirigir al login
      window.location.href = '/';
    }

    if (status === 403){
      // Redirigir a seleccionar grupo
      window.location.href = '/SeleccionarGrupo'
    }

    return Promise.reject(error); 
  }
);

export default axiosAuth;