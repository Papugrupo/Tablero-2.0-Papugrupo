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
  const [error, setError] = useState(null);

  useEffect(() => {
    const mqttClient = mqtt.connect(brokerUrl, options);
    setClient(mqttClient);
    mqttClient.on('connect', () => {
      console.log('✅ Conectado al broker MQTT');
      setIsConnected(true);
      setError(null);
    });

    mqttClient.on('error', (err) => {
      console.error('❌ Error de conexión MQTT:', err);
      setError(err.message);
    });

    mqttClient.on('close', () => {
      console.log('Conexión MQTT cerrada');
      setIsConnected(false);
    });

    mqttClient.on('reconnect', () => {
      console.log('Intentando reconexión MQTT...');
    });

    return () => {
      if (mqttClient) {
        console.log('Cerrando conexión MQTT');
        mqttClient.end();
      }
    };
  }, [brokerUrl]);

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
    error,
    publish,
    subscribe,
    unsubscribe
  };

  return (
    <MqttContext.Provider value={value}>
      {children}
    </MqttContext.Provider>
  );
};