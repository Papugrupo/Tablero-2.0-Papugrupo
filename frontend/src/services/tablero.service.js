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

export const guardarMensajeJSON = async ({ idTableroRef, JSON }) => {
  try {
    const payload = {
      ...JSON,
      idTableroRef: idTableroRef 
    };
    console.log(payload);

    const response = await axiosAuth.post('api/board/save-message-JSON', payload);

    return response.data;
  } catch (error) {
    console.error("Error al guardar el mensaje JSON:", error);
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

export const crearTablero = async ({nombreTablero, protocoloTablero, ipTablero, topicoTablero, formatoMensaje, atributosJson}) => {
    try {
        const payload = {
            nombreTablero: nombreTablero,
            protocoloTablero: protocoloTablero,
            ipTablero: ipTablero,
            topicoTablero: topicoTablero,
            formatoMensaje: formatoMensaje
        };

        // Condicionalmente añadir atributosJson si formatoMensaje es 'JSON' y existen
        if (formatoMensaje === 'JSON' && atributosJson) {
            payload.atributosJson = atributosJson;
        }

        const response = await axiosAuth.post('api/board/add-board', payload);

        console.log("Tablero creado:", response);
        return response.data;
    } catch (error) {
        console.error("Error al crear tablero: ", error);
        throw error;
    }
};

export const editarTablero = async ({ idTablero, nombreTablero, ipTablero, topicoTablero, formatoMensaje, atributosJson }) => {
    try {
        console.log("atributosJson: "+atributosJson);

        const payload = {
            nombreTablero: nombreTablero,
            ipTablero: ipTablero,
            topicoTablero: topicoTablero,
            formatoMensaje: formatoMensaje, // Añadimos el nuevo campo
        };

        if (formatoMensaje === 'JSON' && atributosJson !== undefined) {
            payload.atributosJson = atributosJson;
        } else if (formatoMensaje === 'TEXTO_PLANO' ||  formatoMensaje === 'PAPUGRUPO') {
            payload.atributosJson = [];
        }

        const response = await axiosAuth.put(`api/board/update-board/${idTablero}`, payload);

        console.log("Tablero actualizado:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al editar tablero: ", error);
        throw error;
    }
};

export const borrarTablero = async (idTablero) => {
    try {
        console.log("ID del tablero a eliminar en service:", idTablero);
        const response = await axiosAuth.delete(`api/board/delete-board/${idTablero}`);
        console.log("Tablero eliminado:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al eliminar tablero: ", error);
        throw error;
    }
};
