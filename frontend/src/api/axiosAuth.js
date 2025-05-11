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
    //const token = Cookies.get('token');
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOiJkOWExMTgzMC01MDNkLTQwNzktOTczYi03Y2JmMWFmZTRmNGIiLCJpZEdydXBvIjoiN2FlMGFmNzItYjBmNS00YzgwLWFmNDUtOTFlYTVjMTVmNDM4IiwiaWF0IjoxNzQ2OTkwODI0LCJleHAiOjE3NDY5OTgwMjR9.FTVEzbAXI5bgLAVXHn4u-SCb-wPCwIE4cZPCFEebJgo";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;