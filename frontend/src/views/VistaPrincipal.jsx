import React, { useRef, useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import './VistaPrincipal.css';
import { MqttProvider, useMqtt } from "../shared/MqttConntection"; // Import the MQTT provider
import { obtenerMensajes, guardarMensaje, obtenerTableros, crearTablero } from "../services/tablero.service"; // Import the API functions

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
  const [mensajes, setMensajes] = useState([{
    id:"a",
    mensaje: "Primer mensaje de ejemplo\nSegunda línea ejemplo",
    velocidad: "3"
  },
  {
    id:"b",
    mensaje: "Segundo mensaje de prueba\nOtra línea de prueba",
    velocidad: "3.5"
  }]); // Array de mensajes desde API
  const [seleccionado, setSeleccionado] = useState(null); // Para manejar selección única

  // NUEVOS ESTADOS PARA EL MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [nuevoTexto1, setNuevoTexto1] = useState("");
  const [nuevoTexto2, setNuevoTexto2] = useState("");
  const [nuevoTablero, setNuevoTablero] = useState("");
  const [nuevaVelocidad, setNuevaVelocidad] = useState("");

  // Referencias para los dos tableros LED
  const marqueeRef1 = useRef(null);
  const marqueeRef2 = useRef(null);
  const [duration, setDuration] = useState(null);
  const [cargando, setCargando] = useState(true); // Estado para mostrar carga
  const [error, setError] = useState(null); // Estado para manejar errores

  // ID del tablero (deberías obtenerlo de props o contexto)
  const idTablero = "f77fa409-1fbd-4186-af7d-68478f8cf45a"; // Cambiar según corresponda
  const [idTableros, setIdTableros] = useState([]); // Estado para manejar los tableros

  const obtenerIdTableros = async () => {
    try {
      const data = await obtenerTableros(); // Llama a la función para obtener los tableros
      console.log("ID de tableros obtenidos:", data);
      setIdTableros(data); // Actualiza el estado con los ID de los tableros
    } catch (err) {
      console.error("Error al obtener ID de tableros:", err);
      setError("No se pudieron cargar los ID de tableros.");
    }
  };  

  const handleNuevoTablero = async () => {
    await crearTablero();
    await obtenerIdTableros();
  }

  useEffect(() => {
    
    obtenerIdTableros();
  }, []); // Llama a la función al cargar el componente

    // Estados para mensaje personalizado
  const [textoPersonalizado1, setTextoPersonalizado1] = useState("");
  const [textoPersonalizado2, setTextoPersonalizado2] = useState("");
  // Nuevos estados para el texto que se mostrará (solo cambia al presionar el botón)
  const [textoMostrado1, setTextoMostrado1] = useState("");
  const [textoMostrado2, setTextoMostrado2] = useState("");
  const [velocidadPersonalizada, setVelocidadPersonalizada] = useState("x1");
  const [modoPersonalizado, setModoPersonalizado] = useState(false);

  // Límite de caracteres para MQTT
  const LIMITE_CARACTERES = 100; // Por línea

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
          { mensaje: "Primer mensaje de ejemplo\nSegunda línea ejemplo", velocidad: "3" },
          { mensaje: "Segundo mensaje de prueba\nOtra línea de prueba", velocidad: "3.5" },
        ]);
      } finally {
        setCargando(false);
      }
    };

    cargarMensajes();
  }, [idTablero]);
  
  // Función para separar las líneas del mensaje
  const obtenerLineasDeMensaje = (mensaje) => {
    if (!mensaje) return ["", ""];
    const lineas = mensaje.split("\n");
    return [lineas[0] || "", lineas[1] || ""];
  };

    // Obtener las líneas del mensaje actual
  const [mensajeTexto1, mensajeTexto2] = mensajeActual !== null
    ? mensajeActual === "personalizado"
      ? [textoMostrado1, textoMostrado2] // Usamos textoMostrado en lugar de textoPersonalizado
      : obtenerLineasDeMensaje(mensajes[mensajeActual]?.mensaje || "")
    : ["", ""];

  const mensajeVelocidad = mensajeActual !== null
    ? (mensajeActual === "personalizado" ? velocidadPersonalizada : `x${mensajes[mensajeActual]?.velocidad}` || "x1")
    : "x1";

  // Función para actualizar el mensaje actual desde mensajes guardados
  const actualizarMensaje = () => {
    if (seleccionado !== null && mensajes[seleccionado]) {
      setMensajeActual(seleccionado);

      // Publicar mensaje en MQTT cuando se actualiza
      if (isConnected) {
        const lineas = obtenerLineasDeMensaje(mensajes[seleccionado].mensaje);
        const mensajeAPublicar = {
          texto1: lineas[0],
          texto2: lineas[1],
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
    if (textoPersonalizado1.trim() !== "" || textoPersonalizado2.trim() !== "") {
      // Verificar que no exceda el límite de caracteres
      if (textoPersonalizado1.length > LIMITE_CARACTERES || textoPersonalizado2.length > LIMITE_CARACTERES) {
        alert(`El mensaje excede el límite de ${LIMITE_CARACTERES} caracteres por línea permitidos para MQTT.`);
        return;
      }

      // Actualizar los textos que se mostrarán
      setTextoMostrado1(textoPersonalizado1.trim());
      setTextoMostrado2(textoPersonalizado2.trim());

      // Actualizar el estado para mostrar el mensaje personalizado
      setMensajeActual("personalizado");

      // Publicar mensaje personalizado en MQTT
      if (isConnected) {
        // Crear el mensaje con formato texto1\ntexto2
        const mensajeTexto = `${textoPersonalizado1.trim()}\n${textoPersonalizado2.trim()}`;
        
        const mensajeAPublicar = {
          mensaje: mensajeTexto, // Enviamos el mensaje en formato "texto1\ntexto2"
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

  // Función para mostrar el contenido de un mensaje en la tabla
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

  // NUEVA FUNCIÓN: Manejo para enviar el nuevo mensaje
  const enviarNuevoMensaje = async (e) => {
    e.preventDefault();
    if (nuevoTexto1.trim() === "" && nuevoTexto2.trim() === "") return; // Al menos una línea debe tener contenido

    // Si se ingresó velocidad, debe ser un número entero o float
    const velocidadInput = nuevaVelocidad.trim();
    const regex = /^[0-9]+(\.[0-9]+)?$/;
    if (velocidadInput !== "" && !regex.test(velocidadInput)) {
      alert("La velocidad debe ser numérica, por ejemplo: 2 o 2.5");
      return;
    }

    // Si se ingresa velocidad, se le antepone la "x", caso contrario se usa "x1"
    // Para el endpoint extraemos el número
    const velocidadFinal = velocidadInput === "" ? 1 : parseFloat(velocidadInput);

    try {
      // Crear el mensaje con formato texto1\ntexto2
      const mensajeCompleto = `${nuevoTexto1.trim()}\n${nuevoTexto2.trim()}`;
      
      // Llama al endpoint para guardar el mensaje
      const respuesta = await guardarMensaje({
        idTableroRef: nuevoTablero, // idTablero definido en el componente
        mensaje: mensajeCompleto, // Aquí ya está en formato texto1\ntexto2
        velocidad: velocidadFinal
      });
      console.log("Respuesta del backend:", respuesta);

      // Actualiza la lista de mensajes
      setMensajes([...mensajes, {
        mensaje: mensajeCompleto, // Guardar en formato texto1\ntexto2
        velocidad: velocidadFinal
      }]);
      setNuevoTexto1("");
      setNuevoTexto2("");
      setNuevaVelocidad("");
      setModalOpen(false);
    } catch {
      alert("Error al guardar el mensaje. Revisa la consola para más información.");
    }
  };

  // Efecto para calcular la duración de la animación
  useEffect(() => {
    const calcularDuracion = () => {
      const el1 = marqueeRef1.current;
      const el2 = marqueeRef2.current;
      
      if ((el1 || el2) && mensajeActual !== null) {
        // Calculamos el ancho máximo entre ambos textos
        const textWidth1 = el1 ? el1.scrollWidth : 0;
        const textWidth2 = el2 ? el2.scrollWidth : 0;
        const textWidth = Math.max(textWidth1, textWidth2);
        
        // Usamos el ancho del primer contenedor como referencia
        const containerWidth = el1 ? el1.parentElement.offsetWidth : 
                               el2 ? el2.parentElement.offsetWidth : 0;
                               
        const factorVelocidad = parseFloat(mensajeVelocidad.replace("x", "")) || 1;

        // Distancia total que debe recorrer el texto
        const distanciaTotal = textWidth + containerWidth;

        // Calculamos la duración basada en la relación distancia/tiempo
        const duracionAjustada = (distanciaTotal / (containerWidth * 0.1)) * (1 / factorVelocidad);

        setDuration(duracionAjustada);

        // Forzar reinicio de la animación para aplicar cambios
        if (el1) {
          el1.style.animation = 'none';
          void el1.offsetHeight; // Trigger reflow
          el1.style.animation = `marqueee ${duracionAjustada}s linear infinite`;
        }
        
        if (el2) {
          el2.style.animation = 'none';
          void el2.offsetHeight; // Trigger reflow
          el2.style.animation = `marqueee ${duracionAjustada}s linear infinite`;
        }
      }
    };

    // Ejecutar inicialmente y al cambiar tamaño
    calcularDuracion();
    const debouncedResize = debounce(calcularDuracion, 100);
    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [mensajeTexto1, mensajeTexto2, mensajeVelocidad, mensajeActual]);

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

  const handleModalOpen = () =>{
    
    setModalOpen(true)
  }

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
        
        {/* Contenedor principal para los dos tableros LED */}
        <div className="led-display-container">
          {/* Primer tablero LED (línea superior) */}
          <div className="marqueee-container mb-2">
            {mensajeActual !== null ? (
              <div
                ref={marqueeRef1}
                className="marqueee-text"
                style={{
                  animation: duration ? `marqueee ${duration}s linear infinite` : "none", 
                  minWidth: 'fit-content'
                }}
              >
                {mensajeTexto1}
              </div>
            ) : (
              <div className="marqueee-text text-gray-500">Tablero vacío</div>
            )}
          </div>
          
          {/* Segundo tablero LED (línea inferior) */}
          <div className="marqueee-container">
            {mensajeActual !== null && mensajeTexto2 ? (
              <div
                ref={marqueeRef2}
                className="marqueee-text marqueee-text-second"
                style={{
                  animation: duration ? `marqueee ${duration}s linear infinite` : "none", 
                  minWidth: 'fit-content'
                }}
              >
                {mensajeTexto2}
              </div>
            ) : (
              <div className="marqueee-text text-gray-500">Tablero vacío</div>
            )}
          </div>
        </div>

        <div className="flex w-full justify-end items-center mt-4">
          <button
              className={`bg-[#9d101a] hover:bg-[#800b13] cursor-pointer text-white font-bold py-2 px-4 rounded-full shadow-md ${mensajeActual === null ? 'opacity-50 ' : ''
                }`}
              onClick={handleNuevoTablero}
            >
              CREAR NUEVO TABLERO
            </button>
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
              {/* Primera línea de texto */}
              <div>
                <label htmlFor="textoPersonalizado1" className="block text-sm font-medium text-gray-700 mb-1">
                  Línea 1:
                </label>
                <input
                  type="text"
                  id="textoPersonalizado1"
                  value={textoPersonalizado1}
                  onChange={(e) => {
                    // Limitar el texto al número máximo de caracteres
                    if (e.target.value.length <= LIMITE_CARACTERES) {
                      setTextoPersonalizado1(e.target.value);
                    }
                  }}
                  maxLength={LIMITE_CARACTERES}
                  placeholder="Escribe la primera línea aquí..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                />
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-500">
                    Caracteres: {textoPersonalizado1.length}/{LIMITE_CARACTERES}
                  </span>
                  {textoPersonalizado1.length >= LIMITE_CARACTERES && (
                    <span className="text-red-500">Límite alcanzado</span>
                  )}
                </div>
              </div>

              {/* Segunda línea de texto */}
              <div>
                <label htmlFor="textoPersonalizado2" className="block text-sm font-medium text-gray-700 mb-1">
                  Línea 2:
                </label>
                <input
                  type="text"
                  id="textoPersonalizado2"
                  value={textoPersonalizado2}
                  onChange={(e) => {
                    // Limitar el texto al número máximo de caracteres
                    if (e.target.value.length <= LIMITE_CARACTERES) {
                      setTextoPersonalizado2(e.target.value);
                    }
                  }}
                  maxLength={LIMITE_CARACTERES}
                  placeholder="Escribe la segunda línea aquí..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#109d95]"
                />
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-500">
                    Caracteres: {textoPersonalizado2.length}/{LIMITE_CARACTERES}
                  </span>
                  {textoPersonalizado2.length >= LIMITE_CARACTERES && (
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
                disabled={textoPersonalizado1.trim() === "" && textoPersonalizado2.trim() === ""}
                className={`bg-[#109d95] hover:bg-[#4fd1c5] text-white font-bold py-2 px-4 rounded-full shadow-md w-full ${textoPersonalizado1.trim() === "" && textoPersonalizado2.trim() === "" ? 'opacity-50 cursor-not-allowed' : ''
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
              {mensajes.map((msg, idx) => (
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
                  <td className="px-4">{mostrarContenidoMensaje(msg.mensaje)}</td>
                  <td className="px-4 text-center">x{msg.velocidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Modal para agregar nuevo mensaje con dos líneas */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        >
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Nuevo Mensaje</h3>
            <form onSubmit={enviarNuevoMensaje}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-texto1">Línea 1</label>
                <input
                  id="mensaje-texto1"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={nuevoTexto1}
                  onChange={(e) => setNuevoTexto1(e.target.value)}
                  placeholder="Primera línea de texto"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {nuevoTexto1.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-texto2">Línea 2</label>
                <input
                  id="mensaje-texto2"
                  type="text"
                  className="w-full border rounded px-2 py-1"
                  value={nuevoTexto2}
                  onChange={(e) => setNuevoTexto2(e.target.value)}
                  placeholder="Segunda línea de texto"
                  maxLength={LIMITE_CARACTERES}
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {nuevoTexto2.length}/{LIMITE_CARACTERES}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-velocidad">
                  Tableros
                </label>
                <select
                  id="mensaje-tablero"
                  className="w-full border rounded px-2 py-1"
                  value={nuevoTablero}
                  onChange={(e) => setNuevoTablero(e.target.value)}
                >
                  <option value="">Seleccionar tableros</option>
                  {idTableros.map((tablero) => (
                    <option key={tablero.idTablero} value={tablero.idTablero}>
                      {tablero.idTablero}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="mensaje-velocidad">
                  Velocidad
                </label>
                <select
                  id="mensaje-velocidad"
                  className="w-full border rounded px-2 py-1"
                  value={nuevaVelocidad}
                  onChange={(e) => setNuevaVelocidad(e.target.value)}
                >
                  <option value="">Seleccionar velocidad</option>
                  <option value="0.5">0.5</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3</option>
                  <option value="3.5">3.5</option>
                  <option value="4">4</option>
                </select>
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
                  disabled={nuevoTexto1.trim() === "" && nuevoTexto2.trim() === ""}
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