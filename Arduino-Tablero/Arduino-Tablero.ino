#include <WiFi.h>
#include <PubSubClient.h>
#include <MD_Parola.h>
#include <MD_MAX72xx.h>
#include <SPI.h>
#include <ArduinoJson.h>  // Agrega esta librería

// -------------------------
// Configuración del display
// -------------------------
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 8
#define DATA_PIN   23
#define CLK_PIN    18
#define CS_PIN     5

MD_Parola display = MD_Parola(HARDWARE_TYPE, DATA_PIN, CLK_PIN, CS_PIN, MAX_DEVICES);

// -------------------------
// Configuración WiFi y MQTT
// -------------------------
const char ssid[] = "Utalca-visitas";
const char password[] = "";

const char* mqttServer = "186.64.113.149";
const int mqttPort = 1883;
const char* mqttUser = "";
const char* mqttPassword = "";

WiFiClient wifiClient;
PubSubClient client(wifiClient);

// -------------------------
// Callback: cuando llega un mensaje MQTT
// -------------------------
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje recibido en el tema: ");
  Serial.println(topic);

  // Copiar payload a un string
  String jsonStr = "";
  for (unsigned int i = 0; i < length; i++) {
    jsonStr += (char)payload[i];
  }

  Serial.print("Contenido JSON: ");
  Serial.println(jsonStr);

  // Parsear JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, jsonStr);

  if (error) {
    Serial.print("Error al parsear JSON: ");
    Serial.println(error.c_str());
    return;
  }

  const char* texto = doc["texto"];
  const char* velocidadStr = doc["velocidad"];  // Ejemplo: "x3.5"

  float velocidad = 1.0;
  if (velocidadStr[0] == 'x') {
    velocidad = atof(velocidadStr + 1);  // Ignora la 'x' y convierte el resto
  }

  uint16_t delayScroll = 100 / velocidad;  // Ajuste de velocidad

  Serial.print("Texto: ");
  Serial.println(texto);
  Serial.print("Velocidad: x");
  Serial.println(velocidad);

  display.displayClear();
  display.displayScroll(texto, PA_CENTER, PA_SCROLL_LEFT, delayScroll);
}

// -------------------------
// Setup
// -------------------------
void setup() {
  Serial.begin(115200);

  display.begin();
  display.setIntensity(5);
  display.displayClear();
  display.displayScroll("Conectando...", PA_CENTER, PA_SCROLL_LEFT, 100);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado a WiFi");

  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);

  while (!client.connected()) {
    Serial.print("Conectando al broker MQTT...");
    if (client.connect("ESP32Client", mqttUser, mqttPassword)) {
      Serial.println("Conectado");
      client.subscribe("mensaje/actualizar");
    } else {
      Serial.print("Fallo. Reintentando en 5s...");
      delay(5000);
    }
  }
}

// -------------------------
// Loop principal
// -------------------------
void loop() {
  if (!client.connected()) {
    while (!client.connected()) {
      Serial.print("Reconectando...");
      if (client.connect("ESP32Client", mqttUser, mqttPassword)) {
        client.subscribe("mensaje/actualizar");
      } else {
        delay(5000);
      }
    }
  }

  client.loop();

  if (display.displayAnimate()) {
    display.displayReset();
  }
}


