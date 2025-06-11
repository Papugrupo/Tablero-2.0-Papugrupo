import React, { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

const MqttContext = createContext(null);

export const useMqtt = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqtt must be used within an MqttProvider');
  }
  return context;
};

// Función para validar URL de WebSocket
const isValidWebSocketUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Debe ser protocolo ws o wss
    if (!['ws:', 'wss:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Validar que tenga hostname
    if (!urlObj.hostname) {
      return false;
    }
    
    // Validar IP si es una dirección IP
    if (/^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname)) {
      const parts = urlObj.hostname.split('.');
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (num < 0 || num > 255) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error validando URL:', error);
    return false;
  }
};

export const MqttProvider = ({
  children,
  initialBrokerUrl = null,
  options = {}
}) => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mqttError, setMqttError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    console.log("🔄 MQTT Provider - initialBrokerUrl cambió:", initialBrokerUrl);
    
    const connectToMqtt = () => {
      if (!initialBrokerUrl) {
        console.log("📵 No hay URL de broker, desconectando...");
        if (clientRef.current) {
          clientRef.current.end(true);
          clientRef.current = null;
        }
        setIsConnected(false);
        setConnecting(false);
        setMqttError(null);
        return;
      }

      // Validar URL antes de intentar conectar
      if (!isValidWebSocketUrl(initialBrokerUrl)) {
        console.error("❌ URL de WebSocket inválida:", initialBrokerUrl);
        setMqttError(`URL inválida: ${initialBrokerUrl}`);
        setConnecting(false);
        setIsConnected(false);
        return;
      }

      console.log("🔗 Conectando al broker MQTT:", initialBrokerUrl);
      
      if (connecting) {
        console.log("⏳ Ya conectando, omitiendo...");
        return;
      }

      setConnecting(true);
      setMqttError(null);

      try {
        const mqttClient = mqtt.connect(initialBrokerUrl, {
          ...options,
          clientId: `tablero_papugrupo_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
          reconnectPeriod: 0,
          connectTimeout: 10000,
          clean: true
        });

        clientRef.current = mqttClient;

        mqttClient.on('connect', () => {
          console.log('✅ Conectado al broker MQTT:', initialBrokerUrl);
          setIsConnected(true);
          setConnecting(false);
          setMqttError(null);
          setReconnectAttempts(0);
        });

        mqttClient.on('error', (err) => {
          console.error('❌ Error de conexión MQTT:', err.message);
          setMqttError(err.message);
          setConnecting(false);
          setIsConnected(false);
        });

        mqttClient.on('close', () => {
          console.log('🔌 Conexión MQTT cerrada.');
          setIsConnected(false);
          setConnecting(false);
          clientRef.current = null;
        });

        mqttClient.on('offline', () => {
          console.log('📴 Cliente MQTT offline');
          setIsConnected(false);
        });

        // Timeout de seguridad para detectar conexiones colgadas
        const connectionTimeout = setTimeout(() => {
          if (connecting && !isConnected) {
            console.log('⏱️ Timeout de conexión, cancelando...');
            if (clientRef.current === mqttClient) {
              mqttClient.end(true);
              clientRef.current = null;
              setConnecting(false);
              setMqttError('Timeout de conexión');
            }
          }
        }, 15000);

        // Limpiar timeout cuando se conecte o falle
        mqttClient.on('connect', () => clearTimeout(connectionTimeout));
        mqttClient.on('error', () => clearTimeout(connectionTimeout));
        mqttClient.on('close', () => clearTimeout(connectionTimeout));

      } catch (error) {
        console.error('❌ Error al crear cliente MQTT:', error);
        setMqttError(`Error al crear cliente: ${error.message}`);
        setConnecting(false);
        setIsConnected(false);
      }
    };

    // Desconectar cliente existente si hay uno
    if (clientRef.current) {
      console.log("🔄 Desconectando cliente anterior...");
      try {
        clientRef.current.end(true);
        clientRef.current = null;
      } catch (error) {
        console.warn("⚠️ Error al desconectar cliente anterior:", error);
      }
      setIsConnected(false);
      setConnecting(false);
    }

    // Conectar al nuevo broker si hay URL
    if (initialBrokerUrl) {
      setTimeout(connectToMqtt, 100); // Pequeña pausa para asegurar limpieza
    } else {
      // Si no hay URL, asegurar que el estado esté limpio
      setIsConnected(false);
      setConnecting(false);
      setMqttError(null);
    }

    return () => {
      console.log('🧹 Limpiando conexión MQTT...');
      if (clientRef.current) {
        try {
          clientRef.current.end(true);
          clientRef.current = null;
        } catch (error) {
          console.warn('⚠️ Error en cleanup:', error);
        }
      }
      setConnecting(false);
    };
  }, [initialBrokerUrl]); // Solo depende de initialBrokerUrl

  const publish = useCallback((topic, message, opts = {}) => {
    if (clientRef.current && isConnected && topic) {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      clientRef.current.publish(topic, messageToSend, opts, (err) => {
        if (err) {
          console.error(`❌ Error al publicar en MQTT [${topic}]:`, err);
          setMqttError(`Error al publicar: ${err.message}`);
        } else {
          console.log(`📤 Mensaje publicado exitosamente en [${topic}]:`, messageToSend);
        }
      });
      return true;
    }
    
    console.warn(`⚠️ No se puede publicar en [${topic}]: no conectado`);
    return false;
  }, [isConnected]);

  const reconnect = useCallback(() => {
    console.log("🔄 Intentando reconexión manual...");
    
    if (!initialBrokerUrl) {
      setMqttError("No hay URL de broker para reconectar.");
      return;
    }

    if (!isValidWebSocketUrl(initialBrokerUrl)) {
      setMqttError(`URL inválida para reconectar: ${initialBrokerUrl}`);
      return;
    }
    
    setReconnectAttempts(prev => prev + 1);
    
    // Forzar reconexión
    if (clientRef.current) {
      try {
        clientRef.current.end(true);
        clientRef.current = null;
      } catch (error) {
        console.warn('⚠️ Error al cerrar cliente para reconexión:', error);
      }
    }
    
    setIsConnected(false);
    setConnecting(false);
    
    // Reconectar después de breve pausa
    setTimeout(() => {
      if (initialBrokerUrl && isValidWebSocketUrl(initialBrokerUrl)) {
        setConnecting(true);
        setMqttError(null);

        try {
          const mqttClient = mqtt.connect(initialBrokerUrl, {
            ...options,
            clientId: `tablero_papugrupo_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
            reconnectPeriod: 0,
            connectTimeout: 10000,
            clean: true
          });

          clientRef.current = mqttClient;

          mqttClient.on('connect', () => {
            console.log('✅ Reconectado al broker MQTT:', initialBrokerUrl);
            setIsConnected(true);
            setConnecting(false);
            setMqttError(null);
          });

          mqttClient.on('error', (err) => {
            console.error('❌ Error de reconexión MQTT:', err.message);
            setMqttError(err.message);
            setConnecting(false);
            setIsConnected(false);
          });

          mqttClient.on('close', () => {
            console.log('🔌 Reconexión MQTT cerrada.');
            setIsConnected(false);
            setConnecting(false);
            clientRef.current = null;
          });

          // Timeout de seguridad para reconexión
          const reconnectTimeout = setTimeout(() => {
            if (connecting && !isConnected) {
              console.log('⏱️ Timeout de reconexión, cancelando...');
              if (clientRef.current === mqttClient) {
                mqttClient.end(true);
                clientRef.current = null;
                setConnecting(false);
                setMqttError('Timeout de reconexión');
              }
            }
          }, 15000);

          mqttClient.on('connect', () => clearTimeout(reconnectTimeout));
          mqttClient.on('error', () => clearTimeout(reconnectTimeout));
          mqttClient.on('close', () => clearTimeout(reconnectTimeout));

        } catch (error) {
          console.error('❌ Error durante reconexión:', error);
          setMqttError(`Error de reconexión: ${error.message}`);
          setConnecting(false);
          setIsConnected(false);
        }
      }
    }, 500);
  }, [initialBrokerUrl, options, connecting, isConnected]);

  const value = {
    isConnected,
    mqttError,
    connecting,
    reconnectAttempts,
    publish,
    reconnect,
  };

  return (
    <MqttContext.Provider value={value}>
      {children}
    </MqttContext.Provider>
  );
};