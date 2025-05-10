import React, { useRef, useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import './VistaPrincipal.css';
import { MqttProvider, useMqtt } from "../shared/MqttConntection"; // Import the MQTT provider
import { obtenerMensajes } from "../services/tablero.service"; // Import the API function to fetch messages

// Main component with MQTT Provider wrapper
export default function VistaPrincipal() {
  return (
    <MqttProvider>
      <VistaPrincipalContent />
    </MqttProvider>
  );
}

// Content component that uses MQTT
function VistaPrincipalContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mensajeActual, setMensajeActual] = useState(null); // null cuando no hay mensaje
  const [mensajes, setMensajes] = useState([]); // Array de mensajes desde API
  const [seleccionado, setSeleccionado] = useState(null); // Para manejar selección única
  
  // NUEVOS ESTADOS PARA EL MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [nuevaVelocidad, setNuevaVelocidad] = useState("");
  
  const marqueeRef = useRef(null);
  const [duration, setDuration] = useState(null);
  const [cargando, setCargando] = useState(true); // Estado para mostrar carga
  const [error, setError] = useState(null); // Estado para manejar errores

  // ID del tablero (deberías obtenerlo de props o contexto)
  const idTablero = "f77fa409-1fbd-4186-af7d-68478f8cf45a"; // Cambiar según corresponda

  

  // Estados para mensaje personalizado
  const [textoPersonalizado, setTextoPersonalizado] = useState("");
  const [velocidadPersonalizada, setVelocidadPersonalizada] = useState("x1");
  const [modoPersonalizado, setModoPersonalizado] = useState(false);

  // Límite de caracteres para MQTT
  const LIMITE_CARACTERES = 200;

  // Use MQTT context
  const { isConnected, mqttError, publish, reconnect, reconnectAttempts, connecting } = useMqtt();

  // Cargar mensajes al iniciar el componente
  useEffect(() => {
    const cargarMensajes = async () => {
      try {
        setCargando(true);
        const mensajesObtenidos = await obtenerMensajes(idTablero);
        setMensajes(mensajesObtenidos);
        setError(null);
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
        setError('No se pudieron cargar los mensajes guardados');
        // Si hay error, usar mensajes predeterminados para no romper la funcionalidad
        setMensajes([
          { texto: "Primer mensaje de ejemplo", velocidad: "x3" },
          { texto: "Segundo mensaje de prueba", velocidad: "x3.5" },
        ]);
      } finally {
        setCargando(false);
      }
    };

    cargarMensajes();
  }, [idTablero]);

  // Obtener el mensaje actual si existe
  const mensajeTexto = mensajeActual !== null ?
  (mensajeActual === "personalizado" ? textoPersonalizado : mensajes[mensajeActual]?.mensaje || "") : "";

const mensajeVelocidad = mensajeActual !== null ?
  (mensajeActual === "personalizado" ? velocidadPersonalizada : `x${mensajes[mensajeActual]?.velocidad}` || "x1") : "x1";

// Función para actualizar el mensaje actual desde mensajes guardados
const actualizarMensaje = () => {
  if (seleccionado !== null && mensajes[seleccionado]) {
    setMensajeActual(seleccionado);
    
    // Publicar mensaje en MQTT cuando se actualiza
    if (isConnected) {
      const mensajeAPublicar = {
        texto: mensajes[seleccionado].mensaje, // Cambiado de texto a mensaje
        velocidad: `x${mensajes[seleccionado].velocidad}` // Formato x1, x2, etc.
      };
      
      // Publicar en el tópico "mensaje/actualizar"
      publish('mensaje/actualizar', JSON.stringify(mensajeAPublicar));
      console.log(`✅ Mensaje publicado en tópico 'mensaje/actualizar':`, mensajeAPublicar);
    } else {
      console.warn('❌ No se pudo publicar el mensaje: No hay conexión MQTT');
    }
    
    setSeleccionado(null); // Limpiar selección
    setModoPersonalizado(false); // Salir del modo personalizado
  }
};

  // Función para actualizar con mensaje personalizado
  const actualizarMensajePersonalizado = () => {
    if (textoPersonalizado.trim() !== "") {
      // Verificar que no exceda el límite de caracteres
      if (textoPersonalizado.length > LIMITE_CARACTERES) {
        alert(`El mensaje excede el límite de ${LIMITE_CARACTERES} caracteres permitidos para MQTT.`);
        return;
      }

      setMensajeActual("personalizado");

      // Publicar mensaje personalizado en MQTT
      if (isConnected) {
        const mensajeAPublicar = {
          texto: textoPersonalizado,
          velocidad: velocidadPersonalizada
        };

        try {
          const mensajeJSON = JSON.stringify(mensajeAPublicar);
          console.log(`📊 Tamaño del mensaje MQTT: ${mensajeJSON.length} bytes`);

          publish('mensaje/actualizar', mensajeJSON);
          console.log(`✅ Mensaje personalizado publicado en tópico 'mensaje/actualizar':`, mensajeAPublicar);
        } catch (error) {
          console.error(`❌ Error al publicar mensaje: ${error.message}`);
          alert(`Error al enviar mensaje: ${error.message}`);
        }
      } else {
        console.warn('❌ No se pudo publicar el mensaje personalizado: No hay conexión MQTT');
        alert('No hay conexión MQTT. Revisa la conexión e intenta de nuevo.');
      }

      setSeleccionado(null); // Limpiar selección
    }
  };

  // Función para limpiar el tablero
  const limpiarTablero = () => {
    setMensajeActual(null);
    setSeleccionado(null);

    // Publicar mensaje de limpieza en MQTT
    if (isConnected) {
      publish('mensaje/actualizar', JSON.stringify({ comando: 'limpiar' }));
      console.log('✅ Comando de limpieza publicado en MQTT');
    } else {
      console.warn('❌ No se pudo publicar el comando de limpieza: No hay conexión MQTT');
    }
  };

  // Función para manejar selección única
  const seleccionarMensaje = (index) => {
    setSeleccionado(seleccionado === index ? null : index);
  };

  // Función para alternar entre modo personalizado y predefinido
  const toggleModoPersonalizado = () => {
    setModoPersonalizado(!modoPersonalizado);
    setSeleccionado(null); // Limpiar selección cuando cambiamos de modo
  };

  // NUEVA FUNCIÓN: Manejo para enviar el nuevo mensaje
  const enviarNuevoMensaje = (e) => {
    e.preventDefault();
    if (nuevoTexto.trim() === "") return; // No se permiten mensajes vacíos

    // Si se ingresó velocidad, debe ser un número entero o float
    const velocidadInput = nuevaVelocidad.trim();
    const regex = /^[0-9]+(\.[0-9]+)?$/;
    if (velocidadInput !== "" && !regex.test(velocidadInput)) {
      alert("La velocidad debe ser numérica, por ejemplo: 2 o 2.5");
      return;
    }
    
    // Si se ingresa velocidad, se le antepone la "x", caso contrario se usa "x1"
    const velocidadFinal = velocidadInput === "" ? "x1" : `x${velocidadInput}`;
    const nuevoMensaje = {
      texto: nuevoTexto.trim(),
      velocidad: velocidadFinal
    };

    setMensajes([...mensajes, nuevoMensaje]); // Agregar nuevo mensaje a la lista
    setNuevoTexto("");
    setNuevaVelocidad("");
    setModalOpen(false);
  };

  useEffect(() => {
    const calcularDuracion = () => {
      const el = marqueeRef.current;
      if (el && mensajeActual !== null) {
        const textWidth = el.scrollWidth;
        const containerWidth = el.parentElement.offsetWidth;

        const factorVelocidad = parseFloat(mensajeVelocidad.replace("x", "")) || 1;

        // Distancia total que debe recorrer el texto
        const distanciaTotal = textWidth + containerWidth;

        // Calculamos la duración basada en la relación distancia/tiempo
        const duracionAjustada = (distanciaTotal / (containerWidth * 0.1)) * (1 / factorVelocidad);

        setDuration(duracionAjustada);

        // Forzar reinicio de la animación para aplicar cambios
        el.style.animation = 'none';
        void el.offsetHeight; // Trigger reflow
        el.style.animation = `marquee ${duracionAjustada}s linear infinite`;
      }
    };

    // Ejecutar inicialmente y al cambiar tamaño
    calcularDuracion();
    const debouncedResize = debounce(calcularDuracion, 100);
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [mensajeTexto, mensajeVelocidad, mensajeActual]);

  // Función debounce para optimizar
  function debounce(func, wait) {
    let timeout;
    return function () {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait);
    };
  }

  // Opciones de velocidad predefinidas
  const opcionesVelocidad = ["x0.5", "x1", "x1.5", "x2", "x2.5", "x3", "x3.5", "x4"];

  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#1c2b2b]">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      {/* Fondo oscuro cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="pt-6 px-4">
        <h1 className="text-2xl font-bold">Bienvenido Profesor</h1>
        <span className="font-normal">Rodrigo Domínguez</span>

        {/* Indicador de estado MQTT */}
        <div className="flex items-center mt-2 space-x-2">
  <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
  <span className="text-sm">{isConnected ? 'Conectado a MQTT' : 'Desconectado'}</span>
  {!isConnected && !connecting && (
    <button 
      onClick={reconnect}
      disabled={connecting}
      className="bg-[#109d95] hover:bg-[#4fd1c5] text-white text-xs px-2 py-1 rounded"
    >
      {connecting ? 'Conectando...' : `Reconectar ${reconnectAttempts > 0 ? `(${reconnectAttempts})` : ''}`}
    </button>
  )}
  {mqttError && <span className="text-red-500 text-sm ml-2">({mqttError})</span>}
</div>

        <h2 className="text-3xl font-bold mt-8 mb-4">Mensaje actual</h2>
        <div className="marquee-container">
          {mensajeActual !== null ? (
            <div
              ref={marqueeRef}
              className="marquee-text"
              style={{
                animation: duration ? `marquee ${duration}s linear infinite` : "none", minWidth: 'fit-content'
              }}
            >
              {mensajeTexto}
            </div>
          ) : (
            <div className="marquee-text text-gray-500">Tablero vacío</div>
          )}
        </div>

        {/* Sección de entrada de texto personalizado */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold">Texto personalizado</h2>
            <button
              onClick={toggleModoPersonalizado}
              className={`ml-4 px-4 py-1 rounded-full text-sm ${modoPersonalizado
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
                <label htmlFor="textoPersonalizado" className="block text-sm font-medium text-gray-700 mb-1">
                  Texto a mostrar:
                </label>
                <input
                  type="text"
                  id="textoPersonalizado"
                  value={textoPersonalizado}
                  onChange={(e) => {
                    // Limitar el texto al número máximo de caracteres
                    if (e.target.value.length <= LIMITE_CARACTERES) {
                      setTextoPersonalizado(e.target.value);
                    }
                  }}
                  maxLength={LIMITE_CARACTERES}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                />
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-500">
                    Caracteres: {textoPersonalizado.length}/{LIMITE_CARACTERES}
                  </span>
                  {textoPersonalizado.length >= LIMITE_CARACTERES && (
                    <span className="text-red-500">Límite alcanzado</span>
                  )}
                </div>
              </div>

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

              <button
                onClick={actualizarMensajePersonalizado}
                disabled={textoPersonalizado.trim() === ""}
                className={`bg-[#109d95] hover:bg-[#4fd1c5] text-white font-bold py-2 px-4 rounded-full shadow-md w-full ${textoPersonalizado.trim() === "" ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                ACTUALIZAR CON TEXTO PERSONALIZADO
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-6 gap-4">
          <button
            className={`bg-[#109d95] hover:bg-[#4fd1c5] text-white font-bold py-2 px-4 rounded-full shadow-md ${seleccionado === null ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            onClick={actualizarMensaje}
            disabled={seleccionado === null}
          >
            ACTUALIZAR MENSAJE
          </button>
          <button
            className={`bg-[#9d101a] hover:bg-[#800b13] text-white font-bold py-2 px-4 rounded-full shadow-md ${mensajeActual === null ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            onClick={limpiarTablero}
            disabled={mensajeActual === null}
          >
            LIMPIAR TABLERO
          </button>
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Mensajes Guardados</h2>

        {/* Estado de carga */}
        {cargando ? (
          <div className="text-center py-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">Cargando mensajes guardados...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 bg-white rounded-lg shadow-md">
            <p className="text-red-500">{error}</p>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="text-center py-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No hay mensajes guardados</p>
          </div>
        ) : (
          <table className="w-full text-left bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-[#109d95] text-white">
              <tr className="text-center">
                <th className="py-2">Selección</th>
                <th>Creado por</th>
                <th>Mensaje</th>
                <th>Velocidad</th>
              </tr>
            </thead>
            <tbody>
              {/* {mensajes.map((msg, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-200 hover:bg-[#f4f9f9] cursor-pointer ${seleccionado === idx ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => seleccionarMensaje(idx)}
                >
                  <td className="py-2 px-4 text-center">
                    <div className={`w-5 h-5 rounded-full border-2 mx-auto ${seleccionado === idx ? 'bg-[#109d95] border-[#109d95]' : 'border-gray-400'
                      }`} />
                  </td>
                  <td className="px-4">{msg.Usuario?.nombre || "Desconocido"}</td>
                  <td className="px-4">{msg.mensaje}</td>
                  <td className="px-4 text-center">x{msg.velocidad}</td>
                </tr>
              ))} */}
            </tbody>
          </table>
        )}

        <div className="flex justify-center mt-6">
          {/* Se agrega el handler para abrir el modal */}
          <button 
            className="bg-black hover:bg-gray-800 text-white font-bold px-6 py-2 rounded-full cursor-pointer shadow-md transition-colors"
            onClick={() => setModalOpen(true)}
          >
            AGREGAR NUEVO MENSAJE
          </button>
        </div>
      </main>

      {/* Modal para agregar nuevo mensaje */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}   // Opacidad 15%
        >
          <div className="bg-white p-6 rounded-lg w-80">
            <h3 className="text-xl font-bold mb-4">Nuevo Mensaje</h3>
            <form onSubmit={enviarNuevoMensaje}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-texto">Texto</label>
                <input
                  id="mensaje-texto"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={nuevoTexto}
                  onChange={(e) => setNuevoTexto(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-velocidad">Velocidad (opcional)</label>
                <input
                  id="mensaje-velocidad"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  placeholder="Ej: 2.5"
                  value={nuevaVelocidad}
                  onChange={(e) => setNuevaVelocidad(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-[#109d95] text-white hover:bg-[#0f7d71] transition-colors"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}