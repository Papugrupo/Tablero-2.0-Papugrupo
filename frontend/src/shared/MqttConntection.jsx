import React, { useEffect, useState, createContext, useContext } from 'react';
import mqtt from 'mqtt';

const MqttContext = createContext(null);

export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};

export const MqttProvider = ({ children, brokerUrl = import.meta.env.VITE_BROKER_MQTT_URL, options = {} }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mqttError, setMqttError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectTimer, setReconnectTimer] = useState(null);
  const maxReconnectAttempts = 10;

  // Función para conectar al broker MQTT
  const connectToMqtt = () => {
    if (connecting) return;
    
    setConnecting(true);
    console.log(`🔄 Conectando a MQTT: ${brokerUrl}`);
    
    // Usar la URL del backend
    const mqttClient = mqtt.connect(brokerUrl, {
      ...options,
      clientId: `tablero_papugrupo_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      reconnectPeriod: 0, // Desactivamos la reconexión automática para manejarla nosotros
    });
    
    setClient(mqttClient);
    
    mqttClient.on('connect', () => {
      console.log('✅ Conectado al broker MQTT');
      setIsConnected(true);
      setMqttError(null);
      setConnecting(false);
      setReconnectAttempts(0);
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        setReconnectTimer(null);
      }
    });

    mqttClient.on('error', (err) => {
      console.error('❌ Error de conexión MQTT:', err);
      setMqttError(err.message);
      setConnecting(false);
    });

    mqttClient.on('close', () => {
      console.log('Conexión MQTT cerrada');
      setIsConnected(false);
      
      // Iniciar reconexión automática si no hay un temporizador activo
      if (!reconnectTimer && reconnectAttempts < maxReconnectAttempts) {
        handleReconnect();
      }
    });

    mqttClient.on('reconnect', () => {
      console.log('Intentando reconexión MQTT interna...');
    });
  };
  
  // Función para manejar la reconexión con backoff exponencial
  const handleReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    
    const newReconnectAttempts = reconnectAttempts + 1;
    setReconnectAttempts(newReconnectAttempts);
    
    console.log(`🔄 Intento de reconexión ${newReconnectAttempts}/${maxReconnectAttempts}`);
    
    // Calcular tiempo de espera con backoff exponencial (entre 2s y 30s)
    const delay = Math.min(30000, 2000 * Math.pow(1.5, newReconnectAttempts - 1));
    
    const timer = setTimeout(() => {
      // Cerrar el cliente antiguo si existe
      if (client) {
        try {
          client.end(true);
        } catch (e) {
          console.error('Error al cerrar cliente MQTT:', e);
        }
        setClient(null);
      }
      
      // Conectar de nuevo
      connectToMqtt();
      setReconnectTimer(null);
    }, delay);
    
    setReconnectTimer(timer);
  };
  
  // Función para reconectar manualmente
  const reconnect = () => {
    if (client) {
      try {
        client.end(true);
      } catch (e) {
        console.error('Error al cerrar cliente MQTT:', e);
      }
      setClient(null);
    }
    
    setReconnectAttempts(0);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }
    
    // Intentar conectar inmediatamente
    connectToMqtt();
  };

  useEffect(() => {
    connectToMqtt();
    
    return () => {
      if (client) {
        console.log('Cerrando conexión MQTT');
        client.end(true);
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [brokerUrl]); // Reconectar si cambia la URL del broker

  const publish = (topic, message, options = {}) => {
    if (client && isConnected) {
      client.publish(topic, typeof message === 'string' ? message : JSON.stringify(message), options);
      return true;
    } else {
      console.error('No se puede publicar: cliente no conectado');
      return false;
    }
  };

  const subscribe = (topic, options = {}) => {
    if (client && isConnected) {
      client.subscribe(topic, options);
      return true;
    } else {
      console.error('No se puede suscribir: cliente no conectado');
      return false;
    }
  };
  
  const unsubscribe = (topic) => {
    if (client && isConnected) {
      client.unsubscribe(topic);
      return true;
    }
    return false;
  };

  const value = {
    client,
    isConnected,
    mqttError,
    connecting,
    reconnectAttempts,
    publish,
    subscribe,
    unsubscribe,
    reconnect
  };

  return (
    <MqttContext.Provider value={value}>
      {children}
    </MqttContext.Provider>
  );
};