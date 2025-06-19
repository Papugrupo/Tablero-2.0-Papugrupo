// --- LIBRERÍAS ---
#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <MD_Parola.h>
#include <MD_MAX72xx.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <string.h>
#include <Preferences.h>  // --- NUEVO --- Librería para guardar configuración
#include <time.h>
// -------------------------
// Configuración del display
// -------------------------
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES 16
#define DATA_PIN    23
#define CLK_PIN     18
#define CS_PIN      5

MD_Parola display = MD_Parola(HARDWARE_TYPE, DATA_PIN, CLK_PIN, CS_PIN, MAX_DEVICES);
#define NUM_ZONAS 2
#define RESET_BUTTON 0
// -------------------------
// Configuración WiFi y MQTT
// -------------------------
// --- MODIFICADO ---: Ya no se usan credenciales fijas. Se leerán de la memoria.
// const char ssid[] = "Mota2021"; 
// const char password[] = "ep2hhqx5";

// --- NUEVO ---: Nombre de la red Wi-Fi para el modo de configuración
const char* ap_ssid = "Config-Tablero-2.0";

Preferences preferences; // --- NUEVO ---: Objeto para manejar la memoria no volátil

const char* mqttServer = "186.64.113.149";
const int mqttPort = 1883;
const char* mqttUser = "";
const char* mqttPassword = "";
const char* mqttClientName = "ESP32-DisplayParola";

WiFiClient wifiClient;
PubSubClient client(wifiClient);

// -------------------------
// Servidor Web
// -------------------------
WebServer server(80);
bool userIsAuthenticated = false;

const char* www_username = "admin";
const char* www_password = "Tablero20";

// -------------------------
// Variables globales para el mensaje y display
// -------------------------
uint16_t velocidadActual = 100;
bool nuevoMensaje = true;
String textoZona0 = "Iniciando...";
String textoZona1 = "";
String displayIpAddress = "IP: Esperando...";

textEffect_t efectoInGlobal = PA_SCROLL_LEFT;
textEffect_t efectoOutGlobal = PA_SCROLL_LEFT;
uint16_t     pausaMensajeGlobal = 0;

// =======================================================================
// HTML Y FUNCIONES PARA EL MODO DE CONFIGURACIÓN WIFI
// =======================================================================

const char* htmlWifiConfigPage = R"rawliteral(
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Configurar WiFi</title>
<style>body{font-family: Arial, sans-serif; background-color: #f0f0f0; text-align: center; padding: 50px;} h1{color: #333;}
.form-container{background-color: white; padding: 20px; border-radius: 10px; display: inline-block; box-shadow: 0 0 10px rgba(0,0,0,0.1);}
input{width: 90%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px;}
input[type=submit]{background-color: #007bff; color: white; cursor: pointer;}</style></head>
<body><div class="form-container"><h1>Configurar WiFi del Tablero</h1><p>Ingresa los datos de tu red WiFi para que el tablero pueda conectarse.</p>
<form action="/guardarwifi" method="POST"><input type="text" name="ssid" placeholder="Nombre de la Red (SSID)" required><input type="password" name="password" placeholder="Contraseña">
<input type="submit" value="Guardar y Reiniciar"></form></div></body></html>
)rawliteral";

// =======================================================================
// HTML para la página de LOGIN
// -------------------------
const char* htmlLoginPage = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Control Display</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; display: flex; justify-content: center; align-items: center; height: 90vh; }
    .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.2); width: 300px; }
    h1 { color: #0056b3; text-align: center; margin-bottom: 20px; }
    label { display: block; margin-top: 10px; margin-bottom: 5px; font-weight: bold; }
    input[type="text"], input[type="password"] { width: calc(100% - 22px); padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;}
    input[type="submit"] { background-color: #0056b3; color: white; padding: 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%;}
    input[type="submit"]:hover { background-color: #004494; }
    .error { color: red; text-align: center; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Iniciar Sesión</h1>
    <form action="/login" method="POST">
      <label for="username">Usuario:</label>
      <input type="text" id="username" name="username" required>
      <label for="password">Contraseña:</label>
      <input type="password" id="password" name="password" required>
      <input type="submit" value="Entrar">
    </form>
    %ERROR_MSG%
  </div>
</body>
</html>
)rawliteral";

// -------------------------
// HTML para la página de CONTROL 
// -------------------------
const char* htmlControlPage = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Control Display ESP32</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding:0; background-color: #f4f4f4; color: #333; }
    .navbar { background-color: #0056b3; padding: 10px 20px; color: white; display: flex; justify-content: space-between; align-items: center; }
    .navbar a { color: white; text-decoration: none; padding: 8px 15px; border-radius: 4px; }
    .navbar a:hover { background-color: #004494; }
    .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 500px; margin: 20px auto; }
    h1 { color: #0056b3; text-align: center; }
    label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; }
    input[type="text"], select { width: calc(100% - 22px); padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px;}
    input[type="submit"] { background-color: #0056b3; color: white; padding: 12px 25px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 10px;}
    input[type="submit"]:hover { background-color: #004494; }
    #response { margin-top: 20px; padding: 10px; background-color: #e9ecef; border-radius: 4px; text-align: center; min-height: 20px;}
    .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #777; padding-bottom: 20px; }
  </style>
</head>
<body>
  <div class="navbar">
    <span>Control Tablero ESP32</span>
    <a href="/logout">Cerrar Sesión</a>
  </div>
  <div class="container">
    <h1>Control Tablero 2.0</h1>
    <form id="controlForm">
      <label for="message">Mensaje para Zona 0:</label>
      <input type="text" id="message" name="message" maxlength="150" placeholder="Mensaje Zona 0">

      <label for="message2">Mensaje para Zona 1:</label>
      <input type="text" id="message2" name="message2" maxlength="150" placeholder="Mensaje Zona 1">

      <label for="animation">Tipo de Animación:</label>
      <select id="animation" name="animation">
        <option value="PA_SCROLL_LEFT" selected>Desplazar Izquierda</option>
        <option value="PA_SCROLL_RIGHT">Desplazar Derecha</option>
        <option value="PA_SCROLL_UP">Desplazar Arriba</option>
        <option value="PA_SCROLL_DOWN">Desplazar Abajo</option>
        <option value="PA_WIPE">Limpiar (Wipe)</option>
        <option value="PA_CLOSING">Cerrando (Closing)</option>
        <option value="PA_OPENING">Abriendo (Opening)</option>
        <option value="PA_FADE">Desvanecer (Fade)</option>
        <option value="PA_NO_EFFECT">Estático (Sin Efecto)</option>
      </select>
      
      <input type="submit" value="Establecer Mensajes y Animación">
    </form>
    <div id="response"></div>
  </div>
  <div class="footer">
    Tablero 2.0 GPT
  </div>
  <script>
    const form = document.getElementById('controlForm');
    const responseDiv = document.getElementById('response');
    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const message = formData.get('message');
        const message2 = formData.get('message2');
        const animation = formData.get('animation');
        
        responseDiv.textContent = 'Enviando...';
        const url = `/setmessage?message=${encodeURIComponent(message)}&message2=${encodeURIComponent(message2)}&animation=${encodeURIComponent(animation)}`;
        
        fetch(url)
          .then(response => {
            if (!response.ok) {
              if (response.status === 401) { 
                responseDiv.textContent = 'No autorizado. Debes iniciar sesión de nuevo.';
                setTimeout(() => { window.location.href = '/'; }, 3000); // Redirigir al login
                throw new Error('No autorizado');
              }
              throw new Error('Error HTTP: ' + response.status);
            }
            return response.text();
          })
          .then(data => {
            responseDiv.textContent = data;
            setTimeout(() => { responseDiv.textContent = ''; }, 5000);
          })
          .catch(error => {
            if (error.message !== 'No autorizado') { // Evitar doble mensaje
                 responseDiv.textContent = 'Error al enviar: ' + error;
            }
            setTimeout(() => { if(error.message !== 'No autorizado') responseDiv.textContent = ''; }, 5000);
          });
      });
    }
  </script>
</body>
</html>
)rawliteral";
// Handlers de paginas web
void sendHtmlWithReplacement(const String& html, const String& placeholder, const String& value) { /* ... */ }
void handleShowLoginPage(String errorMsg = "") {
  String page = htmlLoginPage;
  if (errorMsg.length() > 0) {
    page.replace("%ERROR_MSG%", "<p class=\"error\">" + errorMsg + "</p>");
  } else {
    page.replace("%ERROR_MSG%", "");
  }
  server.send(200, "text/html", page);
}

void handleLoginAttempt() {
  if (!server.hasArg("username") || !server.hasArg("password") || server.arg("username") == NULL || server.arg("password") == NULL) {
    handleShowLoginPage("Por favor, ingresa usuario y contraseña.");
    return;
  }
  String username = server.arg("username");
  String password = server.arg("password");
  if (username.equals(www_username) && password.equals(www_password)) {
    userIsAuthenticated = true;
    Serial.println("Web: Autenticación exitosa");
    server.sendHeader("Location", "/control", true); // Redirige a la página de control
    server.send(302, "text/plain", ""); 
  } else {
    Serial.println("Web: Autenticación fallida");
    userIsAuthenticated = false;
    handleShowLoginPage("Usuario o contraseña incorrectos.");
  }
}

void handleShowControlPage() {
  if (!userIsAuthenticated) {
    server.sendHeader("Location", "/", true); // Redirige a la página de login
    server.send(302, "text/plain", "");
    return;
  }
  server.send(200, "text/html", htmlControlPage);
}

void handleLogout() {
  userIsAuthenticated = false;
  Serial.println("Web: Usuario cerró sesión");
  server.sendHeader("Location", "/", true); // Redirige a la página de login
  server.send(302, "text/plain", "");
}


// -------------------------
// Manejador para "/setmessage" - Recibe el mensaje del formulario web
// -------------------------
void handleSetMessage() {
  if (!userIsAuthenticated) {
    server.send(401, "text/plain", "No Autorizado. Por favor, inicie sesión.");
    return;
  }
  Serial.println("Web: Recibida solicitud /setmessage (autenticada)");

  String web_msg_z0 = "";
  String web_msg_z1 = "";
  String web_anim_str = ""; 
  bool anim_arg_present = false;

  if (server.hasArg("message")) {
    web_msg_z0 = server.arg("message");
    textoZona0 = web_msg_z0.isEmpty() ? " " : web_msg_z0; // Identificar origen
    Serial.print("Mensaje web para Zona 0 recibido: "); Serial.println(textoZona0);
  } else {
    Serial.println("Argumento 'message' para Zona 0 no encontrado. Se mantiene el texto actual.");
  }

  if (server.hasArg("message2")) {
    web_msg_z1 = server.arg("message2");
    textoZona1 = web_msg_z1.isEmpty() ? " " : web_msg_z1; 
    Serial.print("Mensaje web para Zona 1 recibido: "); Serial.println(textoZona1);
  } else {
    Serial.println("Argumento 'message2' para Zona 1 no encontrado. Se mantiene el texto actual.");
  }

  if (server.hasArg("animation")) {
    web_anim_str = server.arg("animation");
    mapAnimation(web_anim_str.c_str()); 
    anim_arg_present = true;
    Serial.print("Animacion web seleccionada: "); Serial.println(web_anim_str);
  } else {
    Serial.println("Argumento 'animation' no encontrado. Se mantiene la animación actual/default.");
  }
  
  nuevoMensaje = true; 

  String response = "Actualizado. Z0: \"" + textoZona0 + "\", Z1: \"" + textoZona1 + "\"";
  if (anim_arg_present) {
    response += ", Anim: " + web_anim_str;
  } else {
    response += ", Anim: (sin cambios)";
  }
  server.send(200, "text/plain", response);
}

// Funciones de mensaje
void mapAnimation(const char* animStr) {
    textEffect_t efectoInPredeterminado = PA_SCROLL_LEFT;
    textEffect_t efectoOutPredeterminado = PA_SCROLL_LEFT;
    uint16_t pausaPredeterminada = 0;

    Serial.print("mapAnimation: Recibido '"); Serial.print(animStr); Serial.println("'");

    if (strcmp(animStr, "PA_SCROLL_LEFT") == 0) { 
        efectoInGlobal = PA_SCROLL_LEFT; efectoOutGlobal = PA_SCROLL_LEFT; pausaMensajeGlobal = 0; 
    } else if (strcmp(animStr, "PA_SCROLL_RIGHT") == 0) { 
        efectoInGlobal = PA_SCROLL_RIGHT; efectoOutGlobal = PA_SCROLL_RIGHT; pausaMensajeGlobal = 0; 
    } else if (strcmp(animStr, "PA_SCROLL_UP") == 0) { 
        efectoInGlobal = PA_SCROLL_UP; efectoOutGlobal = PA_SCROLL_UP; pausaMensajeGlobal = 0; 
    } else if (strcmp(animStr, "PA_SCROLL_DOWN") == 0) { 
        efectoInGlobal = PA_SCROLL_DOWN; efectoOutGlobal = PA_SCROLL_DOWN; pausaMensajeGlobal = 0; 
    } else if (strcmp(animStr, "PA_WIPE") == 0) { 
        efectoInGlobal = PA_WIPE; efectoOutGlobal = PA_NO_EFFECT; pausaMensajeGlobal = 1500; 
    } else if (strcmp(animStr, "PA_CLOSING") == 0) { 
        efectoInGlobal = PA_CLOSING; efectoOutGlobal = PA_NO_EFFECT; pausaMensajeGlobal = 1500; 
    } else if (strcmp(animStr, "PA_OPENING") == 0) { 
        efectoInGlobal = PA_OPENING; efectoOutGlobal = PA_NO_EFFECT; pausaMensajeGlobal = 1500; 
    } else if (strcmp(animStr, "PA_FADE") == 0) { 
        efectoInGlobal = PA_FADE; efectoOutGlobal = PA_NO_EFFECT; pausaMensajeGlobal = 1500; 
    } else if (strcmp(animStr, "PA_NO_EFFECT") == 0) { 
        efectoInGlobal = PA_PRINT; efectoOutGlobal = PA_NO_EFFECT; pausaMensajeGlobal = 3000; 
    } else { 
        Serial.print("Animacion desconocida: "); Serial.println(animStr);
        Serial.println("Usando valores predeterminados para la animación.");
        efectoInGlobal = efectoInPredeterminado;
        efectoOutGlobal = efectoOutPredeterminado;
        pausaMensajeGlobal = pausaPredeterminada;
    }
}

// -------------------------
// Callback MQTT
// -------------------------
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Mensaje MQTT recibido [");
  Serial.print(topic);
  Serial.println("]:");

  char msgBuffer[length + 1];
  memcpy(msgBuffer, payload, length);
  msgBuffer[length] = '\0';
  Serial.println(msgBuffer);

  // Convertir a String
  String mensaje = String(msgBuffer);
  Serial.print("Texto plano recibido: ");
  Serial.println(mensaje);

  // Separar por '|'
  int sep1 = mensaje.indexOf('|');
  int sep2 = mensaje.indexOf('|', sep1 + 1);

  if (sep1 == -1 || sep2 == -1) {
    Serial.println("Formato incorrecto. Se esperaban 3 partes separadas por '|'.");
    return;
  }

  String textoRaw = mensaje.substring(0, sep1);                // Texto para zonas
  String velocidadStr = mensaje.substring(sep1 + 1, sep2);     // Velocidad
  String animacionStr = mensaje.substring(sep2 + 1);           // Animación

  // Separar textoZona0 y textoZona1 si hay '&'
  int amp = textoRaw.indexOf('&');
  if (amp != -1) {
    textoZona0 = textoRaw.substring(0, amp);
    textoZona1 = textoRaw.substring(amp + 1);
  } else {
    textoZona0 = textoRaw;
    textoZona1 = "";  // Vacía si no hay '&'
  }

  // Velocidad
  float factor = velocidadStr.toFloat();
  if (factor <= 0) factor = 1.0;
  velocidadActual = (uint16_t)(100.0 / factor);
  if (velocidadActual < 10) velocidadActual = 10;
  if (velocidadActual > 1000) velocidadActual = 1000;

  // Animación
  mapAnimation(animacionStr.c_str());

  Serial.print("Z0: ");
  Serial.println(textoZona0);
  Serial.print("Z1: ");
  Serial.println(textoZona1);
  Serial.print("Velocidad: ");
  Serial.println(velocidadActual);
  Serial.print("Animación: ");
  Serial.println(animacionStr);

  nuevoMensaje = true;
}



// -------------------------
// Función para mostrar mensajes de estado y animarlos
// -------------------------
void showStatus(const String& z0, const String& z1, uint16_t displayTime, uint16_t speed = 75, textEffect_t effectZ0 = PA_SCROLL_LEFT, textEffect_t effectZ1 = PA_SCROLL_LEFT) {
    bool statusNuevoMensaje = true;
    unsigned long startTime = millis();

    textEffect_t outEffectZ0 = (effectZ0 == PA_PRINT) ? PA_NO_EFFECT : effectZ0;
    textEffect_t outEffectZ1 = (effectZ1 == PA_PRINT) ? PA_NO_EFFECT : effectZ1;
    
    uint16_t speedParamZ0 = (effectZ0 == PA_PRINT) ? displayTime : speed;
    uint16_t pauseParamZ0 = (effectZ0 == PA_PRINT) ? 0 : 0; 
    uint16_t speedParamZ1 = (effectZ1 == PA_PRINT) ? displayTime : speed;
    uint16_t pauseParamZ1 = (effectZ1 == PA_PRINT) ? 0 : 0;

    while (millis() - startTime < displayTime) {
        if (statusNuevoMensaje) {
            display.displayClear(0);
            display.displayClear(1);
            // Asegurarse de que no se envíen cadenas vacías a displayZoneText si es problemático
            display.displayZoneText(0, z0.length() > 0 ? z0.c_str() : " ", PA_CENTER, speedParamZ0, pauseParamZ0, effectZ0, outEffectZ0);
            display.displayZoneText(1, z1.length() > 0 ? z1.c_str() : " ", PA_CENTER, speedParamZ1, pauseParamZ1, effectZ1, outEffectZ1);
            display.displayReset(0);
            display.displayReset(1);
            statusNuevoMensaje = false;
        }
        if (display.displayAnimate()) {
            if (display.getZoneStatus(0)) { display.displayReset(0); }
            if (display.getZoneStatus(1)) { display.displayReset(1); }
        }
        yield(); 
    }
}


void handleWifiConfigPage() {
    server.send(200, "text/html", htmlWifiConfigPage);
}

void handleWifiSave() {
    showStatus("Guardando...", "", 3000, 100, PA_PRINT, PA_PRINT);
    
    String ssid = server.arg("ssid");
    String password = server.arg("password");

    Serial.println("Guardando nuevas credenciales WiFi...");
    Serial.print("SSID: "); Serial.println(ssid);

    preferences.begin("wifi-creds", false);
    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.end();

    String htmlResponse = "<html><body><h1>Credenciales guardadas!</h1><p>El tablero se reiniciara y se conectara a la nueva red WiFi.</p></body></html>";
    server.send(200, "text/html", htmlResponse);

    delay(2000);
    ESP.restart();
}

void setupAPMode() {
    WiFi.softAP(ap_ssid);
    IPAddress myIP = WiFi.softAPIP();
    
    Serial.println("Iniciando en modo de configuracion (Access Point)...");
    Serial.print("Conéctate a la red: "); Serial.println(ap_ssid);
    Serial.print("IP del portal: "); Serial.println(myIP);

    showStatus("MODO CONFIG", myIP.toString(), 5000, 100, PA_PRINT, PA_PRINT);

    server.on("/", HTTP_GET, handleWifiConfigPage);
    server.on("/guardarwifi", HTTP_POST, handleWifiSave);
    server.begin();
}

// -------------------------
// Conexión con la Hora
// -------------------------
void configurarHoraNTP() {
    configTime(-4 * 3600, 0, "pool.ntp.org", "time.nist.gov"); // UTC-4 para Chile

    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("Error al obtener la hora desde NTP");
    } else {
        Serial.println("Hora NTP sincronizada:");
        Serial.printf("%04d-%02d-%02d %02d:%02d:%02d\n",
            timeinfo.tm_year + 1900, timeinfo.tm_mon + 1,
            timeinfo.tm_mday, timeinfo.tm_hour,
            timeinfo.tm_min, timeinfo.tm_sec);
    }
}

// -------------------------
// Conexión WiFi
// -------------------------
void setupWiFi() {
    delay(10); Serial.println();
    
    // Leer credenciales de la memoria
    preferences.begin("wifi-creds", true); // true = solo lectura
    String ssid = preferences.getString("ssid", "");
    String password = preferences.getString("password", "");
    preferences.end();
    
    Serial.print("Conectando a WiFi: "); Serial.println(ssid);
    showStatus("Conectando a", ssid, 2000, 100); 

    WiFi.begin(ssid.c_str(), password.c_str());
    int retries = 0; 

    while (WiFi.status() != WL_CONNECTED) {
        showStatus("Conectando", String(retries % 2 == 0 ? "." : ".."), 500, PA_PRINT, PA_PRINT); 
        Serial.print(".");
        delay(500);
        retries++;
        
        // Si falla, borra credenciales y reinicia en modo AP
        if (retries > 30) { 
            Serial.println("\nFallo WiFi. Credenciales incorrectas o red fuera de alcance.");
            showStatus("ERROR WIFI", "Reiniciando...", 3000, 100, PA_PRINT, PA_PRINT);
            
            // Borrar credenciales erróneas
            preferences.begin("wifi-creds", false);
            preferences.clear();
            preferences.end();
            
            Serial.println("Credenciales borradas. El dispositivo iniciará en Modo Configuración.");
            delay(1000);
            ESP.restart();
        }
        yield();
    }
    
    Serial.println("\nWiFi Conectado!"); Serial.print("IP: "); Serial.println(WiFi.localIP());
    displayIpAddress = WiFi.localIP().toString(); 
    Serial.print("IP para display (y acceso web): "); Serial.println(displayIpAddress); 
    
    showStatus("WIFI OK", displayIpAddress, 4000, 100, PA_PRINT, PA_PRINT);
}


// -------------------------
// Conexión MQTT
// -------------------------
void connectToMqtt() {
    if (WiFi.status() != WL_CONNECTED) { return; }
    
    unsigned long mqttAttemptStartTime = millis();
    while (!client.connected() && (millis() - mqttAttemptStartTime < 10000)) { 
        Serial.print("Conectando a MQTT...");
        showStatus("Conectando...", "MQTT", 2000, 100, PA_PRINT, PA_PRINT);

        if (client.connect(mqttClientName, mqttUser, mqttPassword)) {
            Serial.println("MQTT Conectado!");
            showStatus("MQTT OK", "", 2000, 100, PA_PRINT, PA_PRINT);
            
            if (client.subscribe("mensaje/actualizar")) { 
                Serial.println("Suscrito a 'mensaje/actualizar'"); 
            } else {
                Serial.println("Error suscripcion MQTT");
                showStatus("ERROR MQTT", "Suscripcion", 3000, 100);
            }
            return; 
        } else {
            Serial.print("Fallo MQTT, rc="); Serial.print(client.state()); Serial.println(" Reintentando...");
            showStatus("ERROR MQTT", "rc=" + String(client.state()), 2500, 100);
            delay(2500); 
        }
    }
    if (!client.connected()){
        Serial.println("Fallo conexión MQTT. Se reintentará desde el loop.");
    }
}


// =======================================================================
//  Setup
// =======================================================================
void setup() {
    Serial.begin(115200);
    pinMode(RESET_BUTTON, INPUT_PULLUP);

  // Si el botón está presionado al iniciar, borra las preferencias
    if (digitalRead(RESET_BUTTON) == LOW) {
    Serial.println("Botón de reseteo presionado. Borrando preferencias...");
    preferences.begin("wifi-creds", false);
    preferences.clear();
    preferences.end();
    delay(2000); // Espera para evitar rebotes
    Serial.println("Preferencias borradas. Reiniciando...");
    ESP.restart();
    }
    display.begin(NUM_ZONAS);
    display.setIntensity(1); 
    display.displayClear();

    display.setZone(0, 0, (MAX_DEVICES / NUM_ZONAS) - 1);
    display.setZone(1, (MAX_DEVICES / NUM_ZONAS), MAX_DEVICES - 1);
    
    showStatus("Arrancando", "Tablero 2.0", 2000, 100); 

    // --- MODIFICADO ---: Lógica de arranque principal
    preferences.begin("wifi-creds", true); // Abrir en modo solo lectura para verificar
    String stored_ssid = preferences.getString("ssid", "");
    preferences.end();

    if (stored_ssid == "") {
        // MODO CONFIGURACIÓN: No hay credenciales guardadas
        setupAPMode();
    } else {
        // MODO NORMAL: Hay credenciales, intentar conectar
        setupWiFi(); 

        if (WiFi.status() == WL_CONNECTED) {
            //Configurar la Hora
            configurarHoraNTP();
            // Configurar cliente MQTT
            client.setServer(mqttServer, mqttPort);
            client.setCallback(callback);
            connectToMqtt();

            // Rutas del servidor web de CONTROL
            server.on("/", HTTP_GET, [](){ handleShowLoginPage(); }); 
            server.on("/login", HTTP_POST, handleLoginAttempt);
            server.on("/control", HTTP_GET, handleShowControlPage);
            server.on("/logout", HTTP_GET, handleLogout);
            server.on("/setmessage", HTTP_GET, handleSetMessage); 
            
            server.begin();
            Serial.println("Servidor HTTP de control iniciado.");
            Serial.print("Accede en tu navegador a: http://"); Serial.println(WiFi.localIP());
        }
    }

    Serial.println("Configuracion finalizada.");
    
    // Mensaje inicial después de toda la configuración
    if (textoZona0.equals("Iniciando...")) {
        textoZona0 = "Listo"; 
    }
    textoZona1 = displayIpAddress; 
    mapAnimation("PA_PRINT"); 
    velocidadActual = 150;
    nuevoMensaje = true; 
}


// =======================================================================
// Loop principal
// =======================================================================
void loop() {
    // --- MODIFICADO ---: El loop ahora distingue entre modo AP y modo normal
    if (WiFi.getMode() == WIFI_AP) {
        // Si estamos en modo de configuración, solo atendemos el servidor web y animamos el display
        server.handleClient();
        display.displayAnimate();
    } else if (WiFi.status() == WL_CONNECTED) {
        // MODO NORMAL: Tu lógica de loop original va aquí
        server.handleClient();

        if (!client.connected()) {
            static unsigned long lastMqttAttempt = 0;
            if (millis() - lastMqttAttempt > 15000) {
                Serial.println("Loop: Intentando reconectar a MQTT...");
                connectToMqtt(); 
                lastMqttAttempt = millis();
            }
        } else {
            client.loop();
        }

        // El resto de tu lógica de display
        if (nuevoMensaje) {
            display.displayClear(0);
            display.displayClear(1);
            // ... (el resto de tu lógica para actualizar el display)
            uint16_t speedParam = velocidadActual;
            uint16_t pauseParam = pausaMensajeGlobal;
            if (efectoInGlobal == PA_PRINT && efectoOutGlobal == PA_NO_EFFECT) {
              speedParam = pausaMensajeGlobal; pauseParam = 0; 
            }
            const char* zona0_msg = textoZona0.length() > 0 ? textoZona0.c_str() : " ";
            const char* zona1_msg = textoZona1.length() > 0 ? textoZona1.c_str() : " ";
            display.displayZoneText(0, zona0_msg, PA_CENTER, speedParam, pauseParam, efectoInGlobal, efectoOutGlobal);
            display.displayZoneText(1, zona1_msg, PA_CENTER, speedParam, pauseParam, efectoInGlobal, efectoOutGlobal);
            display.displayReset(0);
            display.displayReset(1);
            nuevoMensaje = false;
        }

        if (display.displayAnimate()) {
            if (display.getZoneStatus(0)) display.displayReset(0);
            if (display.getZoneStatus(1)) display.displayReset(1);
        }
        
    } else {
        // Se perdió la conexión WiFi, intentar reconectar
        static unsigned long lastWifiAttempt = 0;
        if (millis() - lastWifiAttempt > 30000) {
            Serial.println("WiFi desconectado. Intentando reconectar...");
            userIsAuthenticated = false;
            showStatus("WIFI PERDIDO", "Reconectando", 5000, 100);
            setupWiFi(); // Intentará reconectar, y si falla, reiniciará en modo AP.
            lastWifiAttempt = millis();
        }
    }
    yield(); 
}