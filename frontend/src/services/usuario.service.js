import axiosPublic from '../api/axiosPublic'; 
import axiosAuth from '../api/axiosAuth';
import Cookies from 'js-cookie';

export const loginUsuario = async (usuario) => {
    try {
        const response = await axiosPublic.post(`api/auth/login`,usuario);
        const token = response.data.token;
        Cookies.set('token', token, { expires: 1 });
        return response.data;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
}

export const registrarUsuario = async (usuario) => {
    try {
        const response = await axiosPublic.post(`api/auth/user-registration`, usuario);
        return response.data;
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        throw error;
    }
}

export const obtenerUsuario = async (idUsuario) => {
    try {
        const response = await axiosAuth.get(`api/user/user-info`, idUsuario);
        return response.data;
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        throw error;
    }
}