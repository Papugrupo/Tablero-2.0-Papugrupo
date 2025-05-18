import axiosPublic from '../api/axiosPublic'; 
import Cookies from 'js-cookie';

export const loginUsuario = async (usuario) => {
    try {
        const response = await axiosPublic.post(`/api/auth/login`,usuario);
        const token = response.data.token;
        console.log('token', token);
        Cookies.set('token', token, { expires: 1 });
        return response.data;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
}

export const registrarUsuario = async (usuario) => {
    try {
        const response = await axiosPublic.post(`/api/auth/user-registration`, usuario);
        return response.data;
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        throw error;
    }
}