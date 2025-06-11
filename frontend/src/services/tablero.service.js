import axiosAuth from '../api/axiosAuth.js';
import Cookies from 'js-cookie';



export const obtenerMensajes = async (idTablero) => {
    try {
      const response = await axiosAuth.get(`api/board/messages/${idTablero}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener la mensajes:', error);
      throw error;
    }
};

export const guardarMensaje = async ({ idTableroRef, mensaje, velocidad,animacion}) => {
    try {
        const response = await axiosAuth.post('api/board/save-message', {
            idTableroRef,
            mensaje,
            velocidad,
            animacion
        });
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

export const obtenerTableros = async () => {
    try {
        const response = await axiosAuth.get('api/board/board-list');
        console.log("Tableros obtenidos:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al obtener listado de grupos:", error);
        throw error;
    }
};

export const obtenerInfoTablero = async (idTablero) => {
    try {
        const response = await axiosAuth.get(`api/board/board/${idTablero}`);
        console.log("Información del tablero:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al obtener información del tablero:", error);
        throw error;
    }
}

export const crearGrupo = async ({ nombreGrupo }) => {
    try {
        const response = await axiosAuth.post('api/user/add-group', {
            nombreGrupo
        });

        await unirseGrupo({ idGrupo: response.data.idGrupo });
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

export const crearTablero = async ({nombreTablero, protocoloTablero, ipTablero, topicoTablero}) => {
    try {
        const response = await axiosAuth.post('api/board/add-board',{
            nombreTablero: nombreTablero,
            protocoloTablero: protocoloTablero,
            ipTablero: ipTablero,
            topicoTablero: topicoTablero
        });

        console.log("Tablero:", response);
        return response.data;
    } catch (error) {
        console.error("Error al crear tablero: ", error);
        throw error;
    }
};

export const editarTablero = async ({ idTablero, nombreTablero, ipTablero, topicoTablero }) => {
    try {
        const response = await axiosAuth.put(`api/board/update-board/${idTablero}`, {
            nombreTablero: nombreTablero,
            ipTablero: ipTablero,
            topicoTablero: topicoTablero
        });

        console.log("Tablero actualizado:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al editar tablero: ", error);
        throw error;
    }
};
