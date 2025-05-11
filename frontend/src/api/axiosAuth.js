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
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOiI5ODRkODQ1NC0zZWZhLTQ4ODctOThmZC1mZGM0NTM4ZDIyMTYiLCJpZEdydXBvIjoiODg3YzZlNzQtM2Y3Yy00ZTA2LTk1NjctNWIwYTE5YTA0YmMwIiwiaWF0IjoxNzQ2OTg2NTQ0LCJleHAiOjE3NDY5OTM3NDR9.Mum4Tc5YtIFscF0PnMCMF6I3bLTOWHzOfHnoZRGuEGA";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;