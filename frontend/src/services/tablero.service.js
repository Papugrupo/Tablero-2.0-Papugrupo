import axiosAuth from '../api/axiosAuth.js';


export const obtenerMensajes = async (idTablero) => {
    try {
      const response = await axiosAuth.get(`api/board/messages/${idTablero}`);
      console.log('Mensajes obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener la mascota:', error);
      throw error;
    }
};
