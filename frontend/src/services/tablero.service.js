import axiosAuth from '../api/axiosAuth.js';
import Cookies from 'js-cookie';



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

export const obtenerGrupos = async () => {
    try {
        const response = await axiosAuth.get('api/user/group-list');
        return response.data;
    } catch (error) {
        console.error("Error al obtener listado de grupos:", error);
        throw error;
    }
};

export const crearGrupo = async ({ nombreGrupo }) => {
    try {
        const response = await axiosAuth.post('api/user/add-group', {
            nombreGrupo
        });
        console.log("Grupo creado:", response.data);

        await unirseGrupo({ idGrupo: response.data.idGrupo });
        console.log("Grupo seleccionado:", response);
        return response.data;
    } catch (error) {
        console.error("Error al crear grupo: ", error);
        throw error;
    }
};

export const unirseGrupo = async ({ idGrupo }) => {
    try {
        const response = await axiosAuth.put('api/user/assign-group', {
            idGrupo:idGrupo
        });
        console.log("Grupo seleccionado:", response);
        Cookies.set('token', response.data.token, { expires: 1 });
        return response.data;
    } catch (error) {
        console.error("Error al unirse a grupo: ", error);
        throw error;
    }
}
