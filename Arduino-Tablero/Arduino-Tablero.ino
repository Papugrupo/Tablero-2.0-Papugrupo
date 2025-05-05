#include <WiFi.h>
#include <PubSubClient.h>

// Datos de tu red WiFi
const char ssid[] = "";         // Reemplaza con tu SSID
const char password[] = ""; // Reemplaza con tu contraseña WiFi

// Configuración del broker MQTT
const char* mqttServer = "186.64.113.149"; // Dirección del broker
const int mqttPort = 1883; // Puerto MQTT
const char* mqttUser = "";  // Si no hay usuario, déjalo vacío
const char* mqttPassword = "";  // Si no hay contraseña, déjalo vacío

WiFiClient wifiClient;
PubSubClient client(wifiClient);

// Función que se llama cuando el mensaje es recibido
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje recibido en el tema: ");
  Serial.println(topic);

  Serial.print("Contenido: ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void setup() {
  // Iniciar el puerto serial
  Serial.begin(115200);

  // Conectar al Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Conectado al Wi-Fi");

  // Configurar el cliente MQTT
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);

  // Conectar al broker MQTT
  while (!client.connected()) {
    Serial.print("Conectando al broker MQTT...");
    if (client.connect("ArduinoClient", mqttUser, mqttPassword)) {
      Serial.println("Conectado al broker");

      // Suscribirse al tema "salida/01"
      client.subscribe("mensaje/actualizar");
    } else {
      Serial.print("Error de conexión, reintentando...");
      delay(5000);
    }
  }
}

void loop() {
  // Mantener la conexión con el broker MQTT
  if (!client.connected()) {
    while (!client.connected()) {
      if (client.connect("ArduinoClient", mqttUser, mqttPassword)) {
        client.subscribe("mensaje/salida");
      } else {
        delay(5000);
      }
    }
  }

  // Llamar a loop() del cliente MQTT para seguir gestionando la conexión
  client.loop();
}