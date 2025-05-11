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

export const guardarMensaje = async ({ idTableroRef, mensaje, velocidad }) => {
    try {
        const response = await axiosAuth.post('api/board/save-message', {
            idTableroRef,
            mensaje,
            velocidad
        });
        console.log("Mensaje guardado:", response.data);
        console.log("Mensaje guardado:", response);
        return response.data;
    } catch (error) {
        console.error("Error al guardar el mensaje:", error);
        throw error;
    }
};
