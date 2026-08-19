/*
 * ============================================================
 *  URAN — Atmospheric Shield  |  ESP32 Firmware
 * ============================================================
 *
 *  Connects to Firebase RTDB and listens for deploy / retract
 *  commands sent from the URAN mobile app. Uses the ESP32 MAC
 *  address as the device ID — no hardcoding needed.
 *
 *  Required libraries (Arduino Library Manager):
 *    • "Firebase ESP Client" by Mobizt
 *    • ESP32 board package by Espressif
 *
 *  Quick-start:
 *    1. Fill in WIFI_SSID, WIFI_PASSWORD, FIREBASE_API_KEY, FIREBASE_DB_URL
 *    2. Wire your relay / motor driver to PIN_DEPLOY and PIN_RETRACT
 *    3. Upload → open Serial Monitor at 115200 baud
 *    4. Copy the printed Device ID into the URAN app (Add Device screen)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>

// ─── Configuration ────────────────────────────────────────────────────────────

#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// Firebase Console → Project Settings → General → Web API Key
#define FIREBASE_API_KEY ""

// Firebase Console → Realtime Database → Data → URL shown at the top
#define FIREBASE_DB_URL  ""

// ─── Hardware pins ────────────────────────────────────────────────────────────
//
//  Wiring example (dual-channel relay module, active-LOW):
//
//    ESP32 pin 26 ──→ Relay IN1 ──→ Motor + direction (DEPLOY)
//    ESP32 pin 27 ──→ Relay IN2 ──→ Motor − direction (RETRACT)
//    ESP32 GND    ──→ Relay GND
//    5 V supply   ──→ Relay VCC
//
//  For a servo instead of relays, ignore these pins and write your
//  own servo logic inside doDeploy() / doRetract().

#define PIN_DEPLOY   26     // Relay IN1 or motor driver DIR+
#define PIN_RETRACT  27     // Relay IN2 or motor driver DIR-
#define PIN_STATUS   2      // Built-in LED — lit when connected and ready

// How long to energise the motor relay (ms). Adjust to your mechanism.
#define MOTOR_RUN_MS 3000

// Commands older than this many seconds are ignored on reconnect / power cycle.
#define STALE_THRESHOLD_S 60

// ─── Firebase objects ─────────────────────────────────────────────────────────

FirebaseData   streamData;
FirebaseAuth   auth;
FirebaseConfig config;

// ─── State ────────────────────────────────────────────────────────────────────

String deviceId        = "";
String lastProcessedAt = "";   // prevents duplicate execution of the same command

// ─── Forward declarations ─────────────────────────────────────────────────────

void streamCallback(FirebaseStream data);
void streamTimeoutCallback(bool timeout);
void doDeploy();
void doRetract();
bool isStale(const String& issuedAt);
void startStream();

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== URAN ESP32 Firmware ===");

  // ── Pins ──────────────────────────────────────────────────────────────────
  pinMode(PIN_DEPLOY,  OUTPUT);
  pinMode(PIN_RETRACT, OUTPUT);
  pinMode(PIN_STATUS,  OUTPUT);

  // Relay modules are typically active-LOW: HIGH = OFF
  digitalWrite(PIN_DEPLOY,  HIGH);
  digitalWrite(PIN_RETRACT, HIGH);
  digitalWrite(PIN_STATUS,  LOW);

  // ── WiFi ──────────────────────────────────────────────────────────────────
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(400);
  }
  Serial.println(" OK");
  Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());

  // ── Device ID ─────────────────────────────────────────────────────────────
  deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  deviceId.toUpperCase();
  Serial.println("─────────────────────────────────────────────");
  Serial.printf("  Device ID  :  %s\n", deviceId.c_str());
  Serial.println("  Enter this in the URAN app → Add Device");
  Serial.println("─────────────────────────────────────────────");

  // ── NTP time sync (needed for stale-command detection) ───────────────────
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  Serial.print("Syncing time");
  struct tm ti;
  int tries = 0;
  while (!getLocalTime(&ti) && tries++ < 20) {
    Serial.print(".");
    delay(500);
  }
  Serial.println(tries < 20 ? " OK" : " (skipped — no NTP)");

  // ── Firebase ──────────────────────────────────────────────────────────────
  config.api_key     = FIREBASE_API_KEY;
  config.database_url = FIREBASE_DB_URL;

  // Anonymous sign-in: empty email + password → Firebase issues a UID
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase: anonymous sign-in OK");
  } else {
    Serial.printf("Firebase sign-in error: %s\n",
                  config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // ── RTDB stream ───────────────────────────────────────────────────────────
  startStream();

  digitalWrite(PIN_STATUS, HIGH);   // LED on = ready
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────────────────

void loop() {
  // Stream callbacks handle everything. Add sensor logic here if needed.
  delay(10);
}

// ─────────────────────────────────────────────────────────────────────────────
//  STREAM CALLBACKS
// ─────────────────────────────────────────────────────────────────────────────

void streamCallback(FirebaseStream data) {
  // Ignore non-JSON payloads (e.g. the initial "null" on first connect)
  if (data.dataTypeEnum() != fb_esp_rtdb_data_type_json) return;

  FirebaseJson     json;
  FirebaseJsonData result;
  json.setJsonData(data.jsonString());

  // ── Read issuedAt ─────────────────────────────────────────────────────────
  json.get(result, "issuedAt");
  if (!result.success) return;
  String issuedAt = result.to<String>();

  if (issuedAt == lastProcessedAt) return;   // already ran this command

  if (isStale(issuedAt)) {
    Serial.printf("Skipping stale command (%s)\n", issuedAt.c_str());
    lastProcessedAt = issuedAt;
    return;
  }

  // ── Read action ───────────────────────────────────────────────────────────
  json.get(result, "action");
  if (!result.success) return;
  String action = result.to<String>();

  Serial.printf(">>> Command: %s  at %s\n", action.c_str(), issuedAt.c_str());
  lastProcessedAt = issuedAt;

  if (action == "deploy") {
    doDeploy();
  } else if (action == "retract") {
    doRetract();
  } else {
    Serial.printf("Unknown action: %s\n", action.c_str());
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("Stream timeout — reconnecting…");
    startStream();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOTOR CONTROL
// ─────────────────────────────────────────────────────────────────────────────

void doDeploy() {
  Serial.println("Deploying cover…");

  digitalWrite(PIN_RETRACT, HIGH);   // ensure opposite relay is OFF first
  delay(50);
  digitalWrite(PIN_DEPLOY, LOW);     // activate relay (LOW = ON for active-low modules)
  delay(MOTOR_RUN_MS);
  digitalWrite(PIN_DEPLOY, HIGH);    // stop motor

  Serial.println("Deploy complete.");
}

void doRetract() {
  Serial.println("Retracting cover…");

  digitalWrite(PIN_DEPLOY, HIGH);    // ensure opposite relay is OFF first
  delay(50);
  digitalWrite(PIN_RETRACT, LOW);    // activate relay
  delay(MOTOR_RUN_MS);
  digitalWrite(PIN_RETRACT, HIGH);   // stop motor

  Serial.println("Retract complete.");
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Returns true if the ISO-8601 timestamp is older than STALE_THRESHOLD_S.
// Returns false (i.e. not stale) when NTP hasn't synced yet (time == 0).
bool isStale(const String& issuedAt) {
  time_t now = time(nullptr);
  if (now < 100000) return false;   // NTP not ready — allow the command

  int yr, mo, dy, hr, mn, sc;
  int matched = sscanf(issuedAt.c_str(), "%d-%d-%dT%d:%d:%d",
                       &yr, &mo, &dy, &hr, &mn, &sc);
  if (matched < 6) return false;

  struct tm t = {};
  t.tm_year = yr - 1900;
  t.tm_mon  = mo - 1;
  t.tm_mday = dy;
  t.tm_hour = hr;
  t.tm_min  = mn;
  t.tm_sec  = sc;

  time_t commandTime = mktime(&t);   // local timezone; NTP is set to UTC above
  return difftime(now, commandTime) > STALE_THRESHOLD_S;
}

void startStream() {
  String path = "/commands/" + deviceId;
  if (Firebase.RTDB.beginStream(&streamData, path.c_str())) {
    Firebase.RTDB.setStreamCallback(&streamData, streamCallback, streamTimeoutCallback);
    Serial.printf("Streaming: %s\n", path.c_str());
  } else {
    Serial.printf("Stream begin error: %s\n", streamData.errorReason().c_str());
  }
}
