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
    
    if (token != 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }else{
      const tempToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZFVzdWFyaW8iOiI4YWQwY2RkNS0wNzUxLTQ2ZGQtYWVmNy1mOTRlNjM1MWExZmUiLCJpYXQiOjE3NDc0Mjc4NzQsImV4cCI6MTc0NzQzNTA3NH0.MFQ44LLW3mdlVdjgyR9SLDubg6SdBHQGPT4YVPKp4no";
      console.log("Token temporal: ", tempToken);
      config.headers.Authorization = `Bearer ${tempToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth;