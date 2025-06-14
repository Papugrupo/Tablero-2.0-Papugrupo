import React, { useRef, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import './VistaPrincipal.css';
import Loading from "../components/shared/Loading";
import { MqttProvider, useMqtt } from "../shared/MqttConntection";
import { obtenerMensajes, guardarMensaje, obtenerTableros, obtenerInfoTablero } from "../services/tablero.service";
import { obtenerUsuario } from "../services/usuario.service";
import ModalNewTablero from "../components/modalNewTablero";
import { HistMensajes } from "../components/HistMensajes";


/** @type {Mensaje[]} */


// Componente Wrapper para configurar MqttProvider dinámicamente
function MqttConfigWrapper() {
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState(null);

  const handleTableroConfigChange = (newBrokerUrl) => {
    console.log("🔄 Cambiando configuración MQTT:", newBrokerUrl);
    setMqttBrokerUrl(newBrokerUrl);
  };

  return (
    <MqttProvider initialBrokerUrl={mqttBrokerUrl}>
      <VistaPrincipalContent onTableroConfigChange={handleTableroConfigChange} />
    </MqttProvider>
  );
}

// Componente principal exportado
export default function VistaPrincipal() {
  return <MqttConfigWrapper />;
}

// Componente de contenido que usa MQTT y maneja la lógica de la vista
function VistaPrincipalContent({ onTableroConfigChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mensajeActual, setMensajeActual] = useState(null);
  const [tableroInfo, setTableroInfo] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });
  const [usuario, setUsuario] = useState({ nombre: "", apellido: "" });
  const [mensajes, setMensajes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  // Estados para modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTableroOpen, setModalTableroOpen] = useState(false);
  const [nuevoTexto1, setNuevoTexto1] = useState("");
  const [nuevoTexto2, setNuevoTexto2] = useState("");
  const [nuevaVelocidad, setNuevaVelocidad] = useState("");
  const [nuevaAnimacion, setNuevaAnimacion] = useState("PA_SCROLL_LEFT");
  const [formatoMensaje, setFormatoMensaje] = useState("json");

  // Referencias para los tableros LED
  const marqueeRef1 = useRef(null);
  const marqueeRef2 = useRef(null);
  const [duration, setDuration] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para tableros
  const [idTableros, setIdTableros] = useState([]);
  const [tableroSeleccionado, setTableroSeleccionado] = useState("");

  // Estados para texto personalizado
  const [textoPersonalizado1, setTextoPersonalizado1] = useState("");
  const [textoPersonalizado2, setTextoPersonalizado2] = useState("");
  const [textoMostrado1, setTextoMostrado1] = useState("");
  const [textoMostrado2, setTextoMostrado2] = useState("");
  const [velocidadPersonalizada, setVelocidadPersonalizada] = useState("x1");
  const [modoPersonalizado, setModoPersonalizado] = useState(false);
  const [animacionPersonalizada, setAnimacionPersonalizada] = useState("PA_SCROLL_LEFT");
  const [animacionActual, setAnimacionActual] = useState("PA_SCROLL_LEFT");
  const [modoUnaLinea, setModoUnaLinea] = useState(false);

  const ANIMACIONES = [
    { valor: "PA_SCROLL_LEFT", nombre: "Desplazamiento a la izquierda" },
    { valor: "PA_SCROLL_RIGHT", nombre: "Desplazamiento a la derecha" },
    { valor: "PA_SCROLL_UP", nombre: "Desplazamiento hacia arriba" },
    { valor: "PA_SCROLL_DOWN", nombre: "Desplazamiento hacia abajo" },
    { valor: "PA_WIPE", nombre: "Barrido" },
    { valor: "PA_CLOSING", nombre: "Cierre de cortina" },
    { valor: "PA_OPENING", nombre: "Apertura de cortina" },
    { valor: "PA_FADE", nombre: "Desvanecimiento" },
    { valor: "PA_NO_EFFECT", nombre: "Sin efecto" },
  ];


  const LIMITE_CARACTERES = 100;

  //para mostrar el historial del mensaje
  const [historialMensajes, setHistorialMensajes] = useState([]);

  const agregarAMensajeHistorial = (nuevoMensaje) => {
    setHistorialMensajes((prev) => [...prev, nuevoMensaje]);
  };

  const ANIMACIONES_LIMITE_REDUCIDO = [
    "PA_SCROLL_UP",
    "PA_SCROLL_DOWN",
    "PA_WIPE",
    "PA_CLOSING",
    "PA_OPENING",
    "PA_FADE"
  ];

  // Límite de caracteres para animaciones específicas
  const LIMITE_CARACTERES_REDUCIDO = 11;

  // Función para validar la longitud del texto según la animación seleccionada
  const validarLongitudTexto = (texto, animacion) => {
    if (ANIMACIONES_LIMITE_REDUCIDO.includes(animacion)) {
      return texto.length <= LIMITE_CARACTERES_REDUCIDO;
    }
    return texto.length <= LIMITE_CARACTERES;
  };

  // Función para obtener el límite de caracteres según la animación
  const obtenerLimiteCaracteres = (animacion) => {
    return ANIMACIONES_LIMITE_REDUCIDO.includes(animacion)
      ? LIMITE_CARACTERES_REDUCIDO
      : LIMITE_CARACTERES;
  };

  const { isConnected, mqttError, publish, reconnect, reconnectAttempts, connecting } = useMqtt();

  const showNotification = (type, title, message, duration = 3000) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), duration);
  };

  useEffect(() => {
    if (ANIMACIONES_LIMITE_REDUCIDO.includes(animacionPersonalizada)) {
      // Si el texto actual excede el límite para la animación seleccionada, truncarlo
      if (textoPersonalizado1.length > LIMITE_CARACTERES_REDUCIDO) {
        setTextoPersonalizado1(textoPersonalizado1.substring(0, LIMITE_CARACTERES_REDUCIDO));
        showNotification(
          'warning',
          'Texto ajustado',
          `La animación seleccionada limita el texto a ${LIMITE_CARACTERES_REDUCIDO} caracteres.`
        );
      }

      if (textoPersonalizado2.length > LIMITE_CARACTERES_REDUCIDO) {
        setTextoPersonalizado2(textoPersonalizado2.substring(0, LIMITE_CARACTERES_REDUCIDO));
        showNotification(
          'warning',
          'Texto ajustado',
          `La animación seleccionada limita el texto a ${LIMITE_CARACTERES_REDUCIDO} caracteres.`
        );
      }
    }
  }, [animacionPersonalizada]);

  const obtenerDatosUsuarioDesdeToken = async () => {
    setCargando(true);
    try {
      const token = Cookies.get('token');
      if (token) {
        const decodedToken = jwtDecode(token);
        if (decodedToken.idUsuario) {
          try {
            const usuarioCompleto = await obtenerUsuario(decodedToken.idUsuario);
            if (usuarioCompleto) {
              setUsuario({
                nombre: usuarioCompleto.nombre || decodedToken.nombre || "Usuario",
                apellido: usuarioCompleto.apellido || decodedToken.apellido || ""
              });
              return;
            }
          } catch (apiError) {
            console.error("Error al obtener datos de usuario desde API:", apiError);
          }
        }
        setUsuario({
          nombre: decodedToken.nombre || "Usuario",
          apellido: decodedToken.apellido || ""
        });
      } else {
        setUsuario({ nombre: "Invitado", apellido: "" });
      }
    } catch (error) {
      console.error("Error al decodificar token:", error);
      setUsuario({ nombre: "Usuario", apellido: "" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerDatosUsuarioDesdeToken();
  }, []);

  const obtenerIdTableros = async () => {
    setCargando(true);
    try {
      const data = await obtenerTableros();
      setIdTableros(data);
    } catch (err) {
      console.error("Error al obtener ID de tableros:", err);
      setError("No se pudieron cargar los ID de tableros.");
    } finally {
      setCargando(false);
    }
  };

  const handleNuevoTablero = () => {
    setModalTableroOpen(true);
  };

  useEffect(() => {
    obtenerIdTableros();
  }, []);

  useEffect(() => {
    if (formatoMensaje === "plano") {
      setTextoPersonalizado2('');
      if (mensajeActual === "personalizado") {
        setMensajeTexto2('');
      }
    }
  }, [formatoMensaje]);

  // Efecto para cargar datos del tablero y gestionar MQTT cuando cambia tableroSeleccionado
  useEffect(() => {
    const cargarDataTablero = async () => {
      if (!tableroSeleccionado) {
        setMensajes([]);
        setTableroInfo(null);
        setMensajeActual(null);
        // Desconectar MQTT si no hay tablero seleccionado
        onTableroConfigChange(null);
        return;
      }

      setCargando(true);
      setError(null);
      try {
        // Cargar información del tablero
        const info = await obtenerInfoTablero(tableroSeleccionado);
        setTableroInfo(info);

        // Cargar mensajes del tablero
        const mensajesObtenidos = await obtenerMensajes(tableroSeleccionado);
        setMensajes(mensajesObtenidos);

        // Configurar conexión MQTT con los datos del tablero
        if (info && info.ipTablero && info.protocoloTablero) {
          const brokerUrl = `${info.protocoloTablero}://${info.ipTablero}`;
          console.log("🔗 Configurando MQTT para tablero:", {
            broker: brokerUrl,
            topico: info.topicoTablero
          });
          onTableroConfigChange(brokerUrl);
        } else {
          console.warn("⚠️ Información de conexión incompleta para el tablero");
          onTableroConfigChange(null);
        }

      } catch (err) {
        console.error('Error al cargar datos del tablero:', err);
        setError(`No se pudieron cargar datos para el tablero: ${err.message}`);
        setMensajes([]);
        setTableroInfo(null);
        onTableroConfigChange(null);
      } finally {
        setCargando(false);
      }
    };

    cargarDataTablero();
  }, [tableroSeleccionado]); // SOLO tableroSeleccionado como dependencia

  // Función para separar las líneas del mensaje
  const obtenerLineasDeMensaje = (mensaje) => {
    if (!mensaje) return ["", ""];
    const lineas = mensaje.split("\n");
    return [lineas[0] || "", lineas[1] || ""];
  };

  // Obtener las líneas del mensaje actual
  const [mensajeTexto1, mensajeTexto2] = mensajeActual !== null
    ? mensajeActual === "personalizado"
      ? [textoMostrado1, textoMostrado2]
      : obtenerLineasDeMensaje(mensajes[mensajeActual]?.mensaje || "")
    : ["", ""];

  const mensajeVelocidad = mensajeActual !== null
    ? (mensajeActual === "personalizado" ? velocidadPersonalizada : `x${mensajes[mensajeActual]?.velocidad}` || "x1")
    : "x1";

  // Función para actualizar el mensaje actual desde mensajes guardados
  const actualizarMensaje = () => {
    if (seleccionado !== null && mensajes[seleccionado]) {
      setMensajeActual(seleccionado);
      setAnimacionActual(mensajes[seleccionado].animacion || "PA_SCROLL_LEFT");

      // Obtener el tópico del tablero actual
      const topicCompleto = tableroInfo?.topicoTablero;

      if (isConnected && topicCompleto) {
        const lineas = obtenerLineasDeMensaje(mensajes[seleccionado].mensaje);

        let mensajeAEnviar;
        if (formatoMensaje === "plano") {
          // Formato de texto plano
          mensajeAEnviar = `${lineas[0]}|${lineas[1]}|x${mensajes[seleccionado].velocidad}|${mensajes[seleccionado].animacion || "PA_SCROLL_LEFT"}`;
          console.log("🔄 Publicando mensaje (texto plano):", mensajeAEnviar);
          publish(topicCompleto, mensajeAEnviar);
        } else {
          // Formato JSON
          const mensajeJSON = {
            texto1: lineas[0],
            texto2: lineas[1],
            velocidad: `x${mensajes[seleccionado].velocidad}`,
            animacion: mensajes[seleccionado].animacion || "PA_SCROLL_LEFT"
          };
          console.log("🔄 Publicando mensaje (JSON):", mensajeJSON);
          publish(topicCompleto, JSON.stringify(mensajeJSON));
          mensajeAEnviar = mensajeJSON;
          agregarAMensajeHistorial({
            tablero: tableroInfo?.nombreTablero || "Tablero desconocido",
            hora: new Date().toLocaleTimeString(),
            topico: topicCompleto,
            mensaje: JSON.stringify(mensajeJSON),
          });
        }

        console.log(`✅ Mensaje publicado en tópico '${topicCompleto}':`, mensajeAEnviar);
        showNotification('success', 'Mensaje enviado', `El mensaje ha sido enviado al tablero LED (formato: ${formatoMensaje.toUpperCase()})`);
      } else {
        if (!topicCompleto) {
          console.warn('⚠️ No se pudo publicar: Tópico del tablero no definido.');
        }
        if (!isConnected) {
          console.warn('⚠️ No se pudo publicar: No hay conexión MQTT.');
        }
        showNotification('warning', 'Error de envío', 'No se pudo enviar el mensaje. Verifique la conexión y configuración del tablero.');
      }

      setSeleccionado(null);
      setModoPersonalizado(false);
    }
  };

  // Función para actualizar con mensaje personalizado
  const actualizarMensajePersonalizado = () => {
    // Validación básica según el formato
    if (formatoMensaje === "plano") {
      if (textoPersonalizado1.trim() === "") {
        showNotification('error', 'Texto vacío', 'Por favor ingresa el texto a mostrar.');
        return;
      }
    } else {
      if (textoPersonalizado1.trim() === "" && textoPersonalizado2.trim() === "") {
        showNotification('error', 'Texto vacío', 'Por favor ingresa al menos una línea de texto.');
        return;
      }
    }

    // Verificar límites de caracteres según animación
    const limiteActual = obtenerLimiteCaracteres(animacionPersonalizada);
    if (textoPersonalizado1.length > limiteActual ||
      (formatoMensaje !== "plano" && textoPersonalizado2.length > limiteActual)) {
      showNotification(
        'warning',
        'Límite excedido',
        `El mensaje excede el límite de ${limiteActual} caracteres permitidos para esta animación.`
      );
      return;
    }

    // Actualizar los textos que se mostrarán localmente
    setMensajeTexto1(textoPersonalizado1.trim());
    setMensajeTexto2(formatoMensaje === "plano" ? "" : textoPersonalizado2.trim());

    // Actualizar el estado para mostrar el mensaje personalizado
    setMensajeActual("personalizado");
    setAnimacionActual(animacionPersonalizada);

    // Publicar mensaje en MQTT según el formato
    if (isConnected) {
      try {
        let mensajeAPublicar;

        if (formatoMensaje === "json") {
          // Formato JSON
          mensajeAPublicar = {
            texto1: textoPersonalizado1.trim(),
            texto2: textoPersonalizado2.trim(),
            velocidad: velocidadPersonalizada,
            animacion: animacionPersonalizada
          };
          publish('mensaje/actualizar', JSON.stringify(mensajeAPublicar));
          agregarAMensajeHistorial({
            tablero: tableroInfo?.nombreTablero || "Tablero desconocido",
            hora: new Date().toLocaleTimeString(),
            topico: tableroInfo?.topicoTablero,
            mensaje: JSON.stringify(mensajeAPublicar),
          });
        } else {
          // Formato texto plano
          mensajeAPublicar = `${textoPersonalizado1.trim()}|${velocidadPersonalizada.replace('x', '')}|${animacionPersonalizada}`;
          publish('mensaje/actualizar', mensajeAPublicar);
          agregarAMensajeHistorial({
            tablero: tableroInfo?.nombreTablero || "Tablero desconocido",
            hora: new Date().toLocaleTimeString(),
            topico: tableroInfo?.topicoTablero,
            mensaje: JSON.stringify(mensajeAPublicar),
          });
        }

        console.log(`✅ Mensaje personalizado publicado en formato ${formatoMensaje}:`, mensajeAPublicar);

        // Mostrar feedback de éxito
        showNotification(
          'success',
          'Mensaje enviado',
          'El texto personalizado ha sido enviado correctamente al tablero LED'
        );
      } catch (error) {
        console.error(`❌ Error al publicar mensaje: ${error.message}`);

        // Mostrar feedback de error
        showNotification(
          'error',
          'Error en el envío',
          `No se pudo enviar el mensaje: ${error.message}`
        );
      }
    } else {
      console.warn('❌ No se pudo publicar el mensaje personalizado: No hay conexión MQTT');

      // Mostrar feedback de advertencia
      showNotification(
        'warning',
        'Sin conexión',
        'No hay conexión MQTT. El mensaje se mostrará localmente pero no se enviará al tablero físico.'
      );
    }

    setSeleccionado(null); // Limpiar selección
  };

  // Función para limpiar el tablero
  const limpiarTablero = () => {
    setMensajeActual(null);
    setSeleccionado(null);

    // Obtener el tópico del tablero actual
    const topicCompleto = tableroInfo?.topicoTablero;

    if (isConnected && topicCompleto) {
      publish(topicCompleto, JSON.stringify({ comando: 'limpiar' }));
      console.log(`✅ Comando de limpieza publicado en tópico '${topicCompleto}'`);
      showNotification('success', 'Tablero limpiado', 'Orden de limpieza enviada al tablero LED');
    } else {
      if (!topicCompleto) {
        console.warn('⚠️ No se pudo limpiar: Tópico del tablero no definido.');
      }
      if (!isConnected) {
        console.warn('⚠️ No se pudo limpiar: No hay conexión MQTT.');
      }
      showNotification('warning', 'Error de limpieza', 'No se pudo limpiar el tablero. Verifique la conexión y configuración.');
    }
  };

  const obtenerClaseAnimacion = (tipoAnimacion) => {
    switch (tipoAnimacion) {
      case "PA_SCROLL_LEFT": return "marqueee-left";
      case "PA_SCROLL_RIGHT": return "marqueee-right";
      case "PA_SCROLL_UP": return "marqueee-up";
      case "PA_SCROLL_DOWN": return "marqueee-down";
      case "PA_WIPE": return "marqueee-wipe";
      case "PA_CLOSING": return "marqueee-closing";
      case "PA_OPENING": return "marqueee-opening";
      case "PA_FADE": return "marqueee-fade";
      case "PA_NO_EFFECT": return "marqueee-no-effect";
      default: return "marqueee-left";
    }
  };

  const seleccionarMensaje = (index) => {
    setSeleccionado(seleccionado === index ? null : index);
  };

  const toggleModoPersonalizado = () => {
    setModoPersonalizado(!modoPersonalizado);
    setSeleccionado(null);
  };

  const mostrarContenidoMensaje = (mensaje) => {
    if (!mensaje) return "Sin contenido";
    const lineas = obtenerLineasDeMensaje(mensaje);
    return (
      <div>
        <div>{lineas[0]}</div>
        {lineas[1] && <div className="text-sm opacity-80">{lineas[1]}</div>}
      </div>
    );
  };

  const enviarNuevoMensaje = async (e) => {
    e.preventDefault();
    if (nuevoTexto1.trim() === "" && nuevoTexto2.trim() === "") return;

    if (!tableroSeleccionado) {
      showNotification('warning', 'Seleccione un tablero', 'Debe seleccionar un tablero antes de guardar un mensaje.');
      return;
    }

    const velocidadInput = nuevaVelocidad.trim();
    const regex = /^[0-9]+(\.[0-9]+)?$/;
    if (velocidadInput !== "" && !regex.test(velocidadInput)) {
      showNotification('error', 'Formato incorrecto', 'La velocidad debe ser numérica, por ejemplo: 2 o 2.5');
      return;
    }

    const velocidadFinal = velocidadInput === "" ? 1 : parseFloat(velocidadInput);
    setCargando(true);

    try {
      const mensajeCompleto = `${nuevoTexto1.trim()}\n${nuevoTexto2.trim()}`;

      await guardarMensaje({
        idTableroRef: tableroSeleccionado,
        mensaje: mensajeCompleto,
        velocidad: velocidadFinal,
        animacion: nuevaAnimacion
      });

      // Recargar mensajes del tablero
      const mensajesObtenidos = await obtenerMensajes(tableroSeleccionado);
      setMensajes(mensajesObtenidos);

      setNuevoTexto1("");
      setNuevoTexto2("");
      setNuevaVelocidad("");
      setNuevaAnimacion("PA_SCROLL_LEFT");
      setModalOpen(false);

      showNotification('success', 'Mensaje guardado', 'El mensaje ha sido guardado exitosamente.');
    } catch (error) {
      console.error("Error al guardar mensaje:", error);
      showNotification('error', 'Error al guardar', 'No se pudo guardar el mensaje.');
    } finally {
      setCargando(false);
    }
  };

  // Efecto para calcular duración de animación
  useEffect(() => {
    const calcularDuracion = () => {
      const el1 = marqueeRef1.current;
      const el2 = marqueeRef2.current;

      if ((el1 || el2) && mensajeActual !== null) {
        const textWidth1 = el1 ? el1.scrollWidth : 0;
        const textWidth2 = el2 ? el2.scrollWidth : 0;
        const textWidth = Math.max(textWidth1, textWidth2);
        const containerWidth = el1 ? el1.parentElement.offsetWidth : el2 ? el2.parentElement.offsetWidth : 0;
        const factorVelocidad = parseFloat(mensajeVelocidad.replace("x", "")) || 1;

        let duracionBase;
        if (["PA_SCROLL_LEFT", "PA_SCROLL_RIGHT"].includes(animacionActual)) {
          const distanciaTotal = textWidth + containerWidth;
          duracionBase = (distanciaTotal / 100);
        } else if (["PA_SCROLL_UP", "PA_SCROLL_DOWN"].includes(animacionActual)) {
          duracionBase = 1;
        } else if (["PA_WIPE"].includes(animacionActual)) {
          const charCount = Math.max(mensajeTexto1 ? mensajeTexto1.length : 0, mensajeTexto2 ? mensajeTexto2.length : 0);
          duracionBase = Math.max(2, charCount * 0.1);
        } else if (["PA_NO_EFFECT"].includes(animacionActual)) {
          duracionBase = 0.5;
        } else {
          duracionBase = 3;
        }

        const duracionFinal = duracionBase / factorVelocidad;
        const duracionAjustada = Math.max(0.5, Math.min(duracionFinal, 15));
        setDuration(duracionAjustada);

        const reiniciarAnimacion = (el) => {
          if (el) {
            el.style.animation = 'none';
            void el.offsetHeight;
            const animClass = obtenerClaseAnimacion(animacionActual);
            const infiniteStr = ["PA_NO_EFFECT"].includes(animacionActual) ? '' : 'infinite';
            el.className = `marqueee-text ${el === marqueeRef2.current ? "marqueee-text-second" : ""} ${animClass}`;
            el.style.animation = `${animClass} ${duracionAjustada}s linear ${infiniteStr}`;
          }
        };

        reiniciarAnimacion(el1);
        reiniciarAnimacion(el2);
      }
    };

    calcularDuracion();
    const debouncedResize = debounce(calcularDuracion, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [mensajeTexto1, mensajeTexto2, mensajeVelocidad, mensajeActual, animacionActual]);

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  const opcionesVelocidad = ["x0.5", "x1", "x1.5", "x2", "x2.5", "x3", "x3.5", "x4"];
  const handleModalOpen = () => setModalOpen(true);

  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#1c2b2b]">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-4 sm:pt-6 px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Bienvenido</h1>
            <span className="font-normal text-lg sm:text-xl">{usuario.nombre} {usuario.apellido}</span>
          </div>

          <div className="flex items-center mt-2 sm:mt-0 space-x-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'Conectado a MQTT' : connecting ? 'Conectando...' : 'Desconectado'}</span>
            {!isConnected && !connecting && (
              <button
                onClick={reconnect}
                disabled={connecting}
                className="bg-[#109d95] hover:bg-[#4fd1c5] text-white text-xs px-2 py-1 rounded"
              >
                {`Reconectar ${reconnectAttempts > 0 ? `(${reconnectAttempts})` : ''}`}
              </button>
            )}
            {mqttError && <span className="text-red-500 text-xs sm:text-sm ml-2">({mqttError})</span>}
          </div>
        </div>
        <div className="mb-4 bg-white p-3 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Formato de mensaje MQTT:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormatoMensaje("json")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formatoMensaje === "json"
                  ? 'bg-[#109d95] text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                📄 JSON
              </button>
              <button
                onClick={() => setFormatoMensaje("plano")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formatoMensaje === "plano"
                  ? 'bg-[#109d95] text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                📝 Texto Plano
              </button>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border">
              {formatoMensaje === "json" ? (
                <span>Formato: <code>{"{"}"texto1":"...", "texto2":"...", "velocidad":"...", "animacion":"..."{"}"}</code></span>
              ) : (
                <span>Formato: <code>texto1|texto2|velocidad|animacion</code></span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 sm:mt-3">
          <div className="flex flex-col sm:flex-row w-full gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="tablero-selector" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Tablero actual:
              </label>
              <div className="relative w-full sm:w-64">
                <select
                  id="tablero-selector"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95] bg-white text-sm"
                  value={tableroSeleccionado}
                  onChange={(e) => setTableroSeleccionado(e.target.value)}
                >
                  <option value="" disabled={!!tableroSeleccionado}>
                    Seleccione un tablero
                  </option>
                  {idTableros.length === 0 && !cargando ? (
                    <option value="" disabled>No hay tableros disponibles</option>
                  ) : (
                    idTableros.map((tablero) => (
                      <option key={tablero.idTablero} value={tablero.idTablero}>
                        {tablero.nombreTablero || tablero.idTablero.substring(0, 8) + '...'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {tableroInfo && tableroSeleccionado && (
              <div className="flex-1 bg-white rounded-lg shadow-md p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{tableroInfo.nombreTablero}</h3>
                    <p className="text-xs text-gray-500">
                      Grupo: {tableroInfo.Grupo?.nombreGrupo || "Sin grupo"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Creado el: {new Date(tableroInfo.creadoEn).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {tableroInfo.Mensajes?.length || 0} mensajes guardados
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {tableroInfo.idTablero.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Información de conexión:</p>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">IP:</span>
                        <span className="text-xs text-gray-800">{tableroInfo.ipTablero || "No configurada"}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">Protocolo:</span>
                        <span className="text-xs text-gray-800">{tableroInfo.protocoloTablero || "No configurado"}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">Tópico MQTT:</span>
                        <span className="text-xs text-gray-800">{tableroInfo.topicoTablero || "No configurado"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4">Mensaje actual</h2>
        <div className="led-display-container">
          <div className="marqueee-container mb-2">
            {mensajeActual !== null ? (
              <div
                ref={marqueeRef1}
                className={`marqueee-text ${obtenerClaseAnimacion(animacionActual)}`}
                style={{
                  animation: duration ? `${obtenerClaseAnimacion(animacionActual)} ${duration}s linear ${animacionActual === "PA_NO_EFFECT" ? '' : 'infinite'}` : "none",
                  minWidth: 'fit-content',
                  fontSize: window.innerWidth < 640 ? '1.5rem' : '2rem'
                }}
              >
                {mensajeTexto1}
              </div>
            ) : (
              <div className="marqueee-text text-gray-500" style={{ fontSize: window.innerWidth < 640 ? '1.5rem' : '2rem' }}>
                Tablero vacío
              </div>
            )}
          </div>

          {/* Segunda línea solo visible en modo JSON y si hay texto */}
          {formatoMensaje !== "plano" && (
            <div className="marqueee-container">
              {mensajeActual !== null && mensajeTexto2 ? (
                <div
                  ref={marqueeRef2}
                  className={`marqueee-text marqueee-text-second ${obtenerClaseAnimacion(animacionActual)}`}
                  style={{
                    animation: duration ? `${obtenerClaseAnimacion(animacionActual)} ${duration}s linear ${animacionActual === "PA_NO_EFFECT" ? '' : 'infinite'}` : "none",
                    minWidth: 'fit-content',
                    fontSize: window.innerWidth < 640 ? '1.5rem' : '2rem'
                  }}
                >
                  {mensajeTexto2}
                </div>
              ) : (
                <div className="marqueee-text text-gray-500" style={{ fontSize: window.innerWidth < 640 ? '1.5rem' : '2rem' }}>
                  Tablero vacío
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex w-full justify-end items-center mt-4">
          <button
            className={`bg-[#9d101a] hover:bg-[#800b13] cursor-pointer text-white font-bold py-2 px-4 rounded-full shadow-md`}
            onClick={handleNuevoTablero}
          >
            CREAR NUEVO TABLERO
          </button>
        </div>

        <div className="mt-6 sm:mt-8 bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Texto personalizado</h2>
            <button
              onClick={toggleModoPersonalizado}
              className={`mt-2 sm:mt-0 sm:ml-4 px-3 sm:px-4 py-1 rounded-full text-sm ${modoPersonalizado
                ? 'bg-[#109d95] text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              {modoPersonalizado ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          {modoPersonalizado && (
            <div className="space-y-4">
              <div>
                {formatoMensaje === "plano" ? (
                  // Modo texto plano: solo un campo de texto
                  <>
                    <label htmlFor="textoPersonalizado" className="block text-sm font-medium text-gray-700 mb-1">
                      Texto a mostrar:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="textoPersonalizado"
                        value={textoPersonalizado1}
                        onChange={(e) => {
                          const nuevoTexto = e.target.value;
                          const limiteActual = obtenerLimiteCaracteres(animacionPersonalizada);
                          if (nuevoTexto.length <= limiteActual) {
                            setTextoPersonalizado1(nuevoTexto);
                            setTextoPersonalizado2(''); // Limpiamos la segunda línea
                          }
                        }}
                        maxLength={obtenerLimiteCaracteres(animacionPersonalizada)}
                        placeholder="Escribe tu mensaje aquí..."
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                      />
                      {ANIMACIONES_LIMITE_REDUCIDO.includes(animacionPersonalizada) && (
                        <span className="absolute right-2 top-2 text-xs text-amber-600 bg-amber-100 px-1 rounded">
                          Máx: 11 car.
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-1 text-xs sm:text-sm">
                      <span className="text-gray-500">
                        Caracteres: {textoPersonalizado1.length}/{obtenerLimiteCaracteres(animacionPersonalizada)}
                      </span>
                      {textoPersonalizado1.length >= obtenerLimiteCaracteres(animacionPersonalizada) && (
                        <span className="text-red-500">Límite alcanzado</span>
                      )}
                    </div>
                  </>
                ) : (
                  // Modo JSON: dos líneas de texto
                  <>
                    <label htmlFor="textoPersonalizado1" className="block text-sm font-medium text-gray-700 mb-1">
                      Línea 1:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="textoPersonalizado1"
                        value={textoPersonalizado1}
                        onChange={(e) => {
                          const nuevoTexto = e.target.value;
                          const limiteActual = obtenerLimiteCaracteres(animacionPersonalizada);
                          if (nuevoTexto.length <= limiteActual) {
                            setTextoPersonalizado1(nuevoTexto);
                          }
                        }}
                        maxLength={obtenerLimiteCaracteres(animacionPersonalizada)}
                        placeholder="Escribe la primera línea aquí..."
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                      />
                      {ANIMACIONES_LIMITE_REDUCIDO.includes(animacionPersonalizada) && (
                        <span className="absolute right-2 top-2 text-xs text-amber-600 bg-amber-100 px-1 rounded">
                          Máx: 11 car.
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-1 text-xs sm:text-sm">
                      <span className="text-gray-500">
                        Caracteres: {textoPersonalizado1.length}/{obtenerLimiteCaracteres(animacionPersonalizada)}
                      </span>
                      {textoPersonalizado1.length >= obtenerLimiteCaracteres(animacionPersonalizada) && (
                        <span className="text-red-500">Límite alcanzado</span>
                      )}
                    </div>

                    <label htmlFor="textoPersonalizado2" className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                      Línea 2:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="textoPersonalizado2"
                        value={textoPersonalizado2}
                        onChange={(e) => {
                          const nuevoTexto = e.target.value;
                          const limiteActual = obtenerLimiteCaracteres(animacionPersonalizada);
                          if (nuevoTexto.length <= limiteActual) {
                            setTextoPersonalizado2(nuevoTexto);
                          }
                        }}
                        maxLength={obtenerLimiteCaracteres(animacionPersonalizada)}
                        placeholder="Escribe la segunda línea aquí (opcional)..."
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                      />
                      {ANIMACIONES_LIMITE_REDUCIDO.includes(animacionPersonalizada) && (
                        <span className="absolute right-2 top-2 text-xs text-amber-600 bg-amber-100 px-1 rounded">
                          Máx: 11 car.
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-1 text-xs sm:text-sm">
                      <span className="text-gray-500">
                        Caracteres: {textoPersonalizado2.length}/{obtenerLimiteCaracteres(animacionPersonalizada)}
                      </span>
                      {textoPersonalizado2.length >= obtenerLimiteCaracteres(animacionPersonalizada) && (
                        <span className="text-red-500">Límite alcanzado</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="velocidadPersonalizada" className="block text-sm font-medium text-gray-700 mb-1">
                    Velocidad:
                  </label>
                  <select
                    id="velocidadPersonalizada"
                    value={velocidadPersonalizada}
                    onChange={(e) => setVelocidadPersonalizada(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                  >
                    {opcionesVelocidad.map(opcion => (
                      <option key={opcion} value={opcion}>{opcion}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="animacionPersonalizada" className="block text-sm font-medium text-gray-700 mb-1">
                    Animación:
                  </label>
                  <select
                    id="animacionPersonalizada"
                    value={animacionPersonalizada}
                    onChange={(e) => setAnimacionPersonalizada(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                  >
                    {ANIMACIONES.map(anim => (
                      <option key={anim.valor} value={anim.valor}>{anim.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={actualizarMensajePersonalizado}
                disabled={(textoPersonalizado1.trim() === "" && (formatoMensaje !== "plano" && textoPersonalizado2.trim() === "")) || !isConnected}
                className={`bg-[#109d95] hover:bg-[#4fd1c5] text-white font-bold py-2 px-4 rounded-full shadow-md w-full ${(textoPersonalizado1.trim() === "" && (formatoMensaje !== "plano" && textoPersonalizado2.trim() === "")) || !isConnected
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
                  }`}
              >
                ACTUALIZAR CON TEXTO PERSONALIZADO
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center mt-4 sm:mt-6 gap-3 sm:gap-4">
          <button
            className={`bg-[#109d95] hover:bg-[#4fd1c5] text-white font-bold py-2 px-4 rounded-full shadow-md ${(seleccionado === null || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={actualizarMensaje}
            disabled={seleccionado === null || !isConnected}
          >
            ACTUALIZAR MENSAJE
          </button>
          <button
            className={`bg-[#9d101a] hover:bg-[#800b13] text-white font-bold py-2 px-4 rounded-full shadow-md ${(mensajeActual === null || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={limpiarTablero}
            disabled={mensajeActual === null || !isConnected}
          >
            LIMPIAR TABLERO
          </button>
        </div>
        {/* Columna par los Mensajes de la sesión*/}
        <div className="p-6 bg-gray-900 min-h-[20vh] text-white rounded-2xl w-2xl">
          <h1 className="text-xl mb-4">Mensajes Enviados</h1>
          <HistMensajes mensajes={historialMensajes} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mt-8 sm:mt-10 mb-3 sm:mb-4">Mensajes Guardados</h2>
        {cargando && !error && mensajes.length === 0 ? (
          <div className="text-center py-4 bg-white rounded-lg shadow-md"><p className="text-gray-600">Cargando mensajes...</p></div>
        ) : error ? (
          <div className="text-center py-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md"><p>{error}</p></div>
        ) : mensajes.length === 0 ? (
          <div className="text-center py-4 bg-white rounded-lg shadow-md"><p className="text-gray-600">No hay mensajes guardados para este tablero.</p></div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#109d95] text-white">
                <tr className="text-center">
                  <th className="py-2 px-2 sm:px-4">Selección</th>
                  <th className="py-2 px-2 sm:px-4">Creado por</th>
                  <th className="py-2 px-2 sm:px-4">Mensaje</th>
                  <th className="py-2 px-2 sm:px-4">Velocidad</th>
                  <th className="py-2 px-2 sm:px-4">Animación</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.map((msg, idx) => (
                  <tr
                    key={msg.idMensaje || idx}
                    className={`border-t border-gray-200 hover:bg-[#f4f9f9] cursor-pointer ${seleccionado === idx ? 'bg-blue-50' : ''}`}
                    onClick={() => seleccionarMensaje(idx)}
                  >
                    <td className="py-2 px-2 sm:px-4 text-center">
                      <div className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full border-2 mx-auto ${seleccionado === idx ? 'bg-[#109d95] border-[#109d95]' : 'border-gray-400'}`} />
                    </td>
                    <td className="px-2 sm:px-4 text-xs sm:text-sm">{msg.Usuario?.nombre || "Desconocido"}</td>
                    <td className="px-2 sm:px-4 text-xs sm:text-sm">{mostrarContenidoMensaje(msg.mensaje)}</td>
                    <td className="px-2 sm:px-4 text-center text-xs sm:text-sm">x{msg.velocidad}</td>
                    <td className="px-2 sm:px-4 text-center text-xs sm:text-sm">{ANIMACIONES.find(anim => anim.valor === msg.animacion)?.nombre || "Desplazamiento"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-2 rounded-full cursor-pointer shadow-md transition-colors"
            onClick={handleModalOpen}
          >
            AGREGAR NUEVO MENSAJE
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Nuevo Mensaje</h3>
            <form onSubmit={enviarNuevoMensaje}>
              {/* Formato de mensaje actual (informativo) */}
              <div className="bg-gray-50 p-2 rounded mb-3 text-xs text-gray-600 flex items-center">
                <span className="font-medium mr-1">Formato actual:</span>
                {formatoMensaje === "json" ?
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-medium rounded">JSON (dos líneas)</span> :
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 font-medium rounded">Texto plano (una línea)</span>
                }
              </div>

              {/* Campos de texto que cambian según el formato */}
              {formatoMensaje === "plano" ? (
                // Modo texto plano: una línea
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1" htmlFor="mensaje-texto">Mensaje</label>
                  <div className="relative">
                    <input
                      id="mensaje-texto"
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={nuevoTexto1}
                      onChange={(e) => {
                        const nuevoTexto = e.target.value;
                        const limiteActual = obtenerLimiteCaracteres(nuevaAnimacion);
                        if (nuevoTexto.length <= limiteActual) {
                          setNuevoTexto1(nuevoTexto);
                        }
                      }}
                      placeholder="Escribe tu mensaje aquí"
                      maxLength={obtenerLimiteCaracteres(nuevaAnimacion)}
                    />
                    {ANIMACIONES_LIMITE_REDUCIDO.includes(nuevaAnimacion) && (
                      <span className="absolute right-2 top-1 text-xs text-amber-600 bg-amber-100 px-1 rounded">
                        Máx: 11 car.
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {nuevoTexto1.length}/{obtenerLimiteCaracteres(nuevaAnimacion)}
                    </span>
                    {nuevoTexto1.length >= obtenerLimiteCaracteres(nuevaAnimacion) && (
                      <span className="text-xs text-red-500">Límite alcanzado</span>
                    )}
                  </div>
                </div>
              ) : (
                // Modo JSON: dos líneas
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="mensaje-texto1">Línea 1</label>
                    <div className="relative">
                      <input
                        id="mensaje-texto1"
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={nuevoTexto1}
                        onChange={(e) => {
                          const nuevoTexto = e.target.value;
                          const limiteActual = obtenerLimiteCaracteres(nuevaAnimacion);
                          if (nuevoTexto.length <= limiteActual) {
                            setNuevoTexto1(nuevoTexto);
                          }
                        }}
                        placeholder="Primera línea de texto"
                        maxLength={obtenerLimiteCaracteres(nuevaAnimacion)}
                      />
                      {ANIMACIONES_LIMITE_REDUCIDO.includes(nuevaAnimacion) && (
                        <span className="absolute right-2 top-1 text-xs text-amber-600 bg-amber-100 px-1 rounded">
                          Máx: 11 car.
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {nuevoTexto1.length}/{obtenerLimiteCaracteres(nuevaAnimacion)}
                      </span>
                      {nuevoTexto1.length >= obtenerLimiteCaracteres(nuevaAnimacion) && (
                        <span className="text-xs text-red-500">Límite alcanzado</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" htmlFor="mensaje-texto2">Línea 2</label>
                    <div className="relative">
                      <input
                        id="mensaje-texto2"
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={nuevoTexto2}
                        onChange={(e) => {
                          const nuevoTexto = e.target.value;
                          const limiteActual = obtenerLimiteCaracteres(nuevaAnimacion);
                          if (nuevoTexto.length <= limiteActual) {
                            setNuevoTexto2(nuevoTexto);
                          }
                        }}
                        placeholder="Segunda línea de texto"
                        maxLength={obtenerLimiteCaracteres(nuevaAnimacion)}
                      />
                      {ANIMACIONES_LIMITE_REDUCIDO.includes(nuevaAnimacion) && (
                        <span className="absolute right-2 top-1 text-xs text-amber-600 bg-amber-100 px-1 rounded">
                          Máx: 11 car.
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {nuevoTexto2.length}/{obtenerLimiteCaracteres(nuevaAnimacion)}
                      </span>
                      {nuevoTexto2.length >= obtenerLimiteCaracteres(nuevaAnimacion) && (
                        <span className="text-xs text-red-500">Límite alcanzado</span>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-velocidad">Velocidad</label>
                <select id="mensaje-velocidad" className="w-full border rounded px-2 py-1" value={nuevaVelocidad} onChange={(e) => setNuevaVelocidad(e.target.value)}>
                  <option value="">Seleccionar velocidad</option>
                  {opcionesVelocidad.map(v => v.replace('x', '')).map(val => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-animacion">Animación</label>
                <select
                  id="mensaje-animacion"
                  className="w-full border rounded px-2 py-1"
                  value={nuevaAnimacion}
                  onChange={(e) => {
                    setNuevaAnimacion(e.target.value);
                    // Truncar el texto si es necesario al cambiar a animación con límite reducido
                    if (ANIMACIONES_LIMITE_REDUCIDO.includes(e.target.value)) {
                      if (nuevoTexto1.length > LIMITE_CARACTERES_REDUCIDO) {
                        setNuevoTexto1(nuevoTexto1.substring(0, LIMITE_CARACTERES_REDUCIDO));
                        showNotification(
                          'warning',
                          'Texto ajustado',
                          `La animación seleccionada limita el texto a ${LIMITE_CARACTERES_REDUCIDO} caracteres.`
                        );
                      }
                      if (formatoMensaje === "json" && nuevoTexto2.length > LIMITE_CARACTERES_REDUCIDO) {
                        setNuevoTexto2(nuevoTexto2.substring(0, LIMITE_CARACTERES_REDUCIDO));
                      }
                    }
                  }}
                >
                  {ANIMACIONES.map(anim => (
                    <option key={anim.valor} value={anim.valor}>{anim.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-[#109d95] text-white hover:bg-[#0f7d71] transition-colors text-sm"
                  disabled={(formatoMensaje === "plano" ? nuevoTexto1.trim() === "" :
                    (nuevoTexto1.trim() === "" && nuevoTexto2.trim() === ""))
                    || !nuevaVelocidad || !tableroSeleccionado}
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Loading isOpen={cargando} />
      {modalTableroOpen && <ModalNewTablero setModalOpen={setModalTableroOpen} obtenerTableros={obtenerIdTableros} />}
      {notification.show && (
        <div
          className={`fixed bottom-0 right-0 m-6 w-auto max-w-sm shadow-xl rounded-lg py-4 px-6 border-l-4 transition-all duration-300 ease-in-out ${notification.type === 'success' ? 'bg-white border-green-500' : notification.type === 'error' ? 'bg-white border-red-500' : 'bg-white border-yellow-500'}`}
          role="alert"
        >
          <div className="flex items-center">
            <strong className={`font-semibold ${notification.type === 'success' ? 'text-green-700' : notification.type === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
              {notification.title}
            </strong>
            <button onClick={() => setNotification(prev => ({ ...prev, show: false }))} className="ml-auto -mr-2 -mt-2 text-gray-400 hover:text-gray-600">
              <span className="text-xl">×</span>
            </button>
          </div>
          <span className="block text-gray-600 mt-1 text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  );
}