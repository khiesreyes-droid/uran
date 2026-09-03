/*
 * ============================================================
 *  URAN — Atmospheric Shield  |  ESP32 Sensor Uploader
 * ============================================================
 *
 *  Reads atmospheric + radiation sensors and pushes live
 *  telemetry to Firebase Realtime Database every UPLOAD_INTERVAL_S.
 *
 *  Uses FirebaseClient v3 (newer Mobizt library).
 *
 *  RTDB paths written:
 *    /devices/{MAC}/status/online        true
 *    /devices/{MAC}/status/lastSeen      ISO-8601 timestamp
 *    /devices/{MAC}/latest/*             latest sensor snapshot
 *    /devices/{MAC}/readings/{epoch}/*   historical log entry
 *
 *  Required libraries (Arduino Library Manager):
 *    • "FirebaseClient" by Mobizt  (v3+, NOT the old "Firebase ESP Client")
 *    • "Adafruit BME280 Library"   (pulls in Adafruit Unified Sensor)
 *    • ESP32 board package by Espressif
 *
 *  Quick-start:
 *    1. Fill in WIFI_SSID, WIFI_PASSWORD
 *    2. Verify FIREBASE_API_KEY and FIREBASE_DB_URL
 *    3. Wire BME280 to SDA/SCL (default pins 21/22)
 *    4. Wire Geiger pulse wire to PIN_GEIGER (default pin 34)
 *    5. Upload → open Serial Monitor at 115200 baud
 *    6. Copy the printed Device ID into the URAN app
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <FirebaseClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <time.h>

// ─── Configuration ────────────────────────────────────────────────────────────

#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

#define FIREBASE_API_KEY "AIzaSyCbwVIdWmTLTcxJ7Vo1mJ34nNdqypsbag4"
#define FIREBASE_DB_URL  "https://uran-48e06-default-rtdb.asia-southeast1.firebasedatabase.app"

#define UPLOAD_INTERVAL_S  30

#define PIN_GEIGER   34
#define PIN_RAIN     35     // Analog rain sensor output (input-only ADC pin)
#define PIN_STATUS   2

#define RAIN_SAMPLES 10     // ADC readings averaged per upload

// J305 tube: counts per minute → µSv/h
#define CPM_TO_USVH  0.00812f

// ─── Firebase v3 objects ──────────────────────────────────────────────────────

WiFiClientSecure  sslClient;
DefaultNetwork    network(/* reconnect */ true);
NoAuth            noAuth;                        // anonymous — no user/password needed
FirebaseApp       app;
AsyncClientClass  aClient(sslClient, getNetwork(network));
RealtimeDatabase  db;

// ─── Sensor objects ───────────────────────────────────────────────────────────

Adafruit_BME280 bme;
bool            bmeOk = false;

// ─── Geiger state (ISR) ───────────────────────────────────────────────────────

volatile uint32_t geigerPulses = 0;
uint32_t          lastResetMs  = 0;

// ─── State ────────────────────────────────────────────────────────────────────

String   deviceId = "";
uint32_t lastUpMs = 0;

// ─── Forward declarations ─────────────────────────────────────────────────────

void     initFirebase();
void     uploadReading();
float    readRainAvg();
String   isoTimestamp();
void     blink(int n, int onMs = 80, int offMs = 120);
void IRAM_ATTR onGeigerPulse();

// ─────────────────────────────────────────────────────────────────────────────
//  ISR
// ─────────────────────────────────────────────────────────────────────────────

void IRAM_ATTR onGeigerPulse() {
  geigerPulses++;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== URAN Sensor Uploader (FirebaseClient v3) ===");

  pinMode(PIN_STATUS, OUTPUT);
  digitalWrite(PIN_STATUS, LOW);

  // ── Rain sensor ──────────────────────────────────────────────────────────
  pinMode(PIN_RAIN, INPUT);

  // ── Geiger ───────────────────────────────────────────────────────────────
  pinMode(PIN_GEIGER, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIN_GEIGER), onGeigerPulse, FALLING);
  lastResetMs = millis();
  Serial.println("Geiger interrupt armed on pin " + String(PIN_GEIGER));

  // ── BME280 ───────────────────────────────────────────────────────────────
  Wire.begin();
  bmeOk = bme.begin(0x76);
  if (!bmeOk) bmeOk = bme.begin(0x77);
  Serial.println(bmeOk ? "BME280: OK" : "BME280: not found — skipping atmospheric data");

  // ── WiFi ─────────────────────────────────────────────────────────────────
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { Serial.print("."); delay(400); }
  Serial.println(" OK");
  Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());

  // ── Device ID ────────────────────────────────────────────────────────────
  deviceId = WiFi.macAddress();
  deviceId.replace(":", "");
  deviceId.toUpperCase();
  Serial.println("─────────────────────────────────────────────");
  Serial.printf("  Device ID  :  %s\n", deviceId.c_str());
  Serial.println("  Enter this in the URAN app → Add Device");
  Serial.println("─────────────────────────────────────────────");

  // ── NTP ──────────────────────────────────────────────────────────────────
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  Serial.print("Syncing time");
  struct tm ti;
  int tries = 0;
  while (!getLocalTime(&ti) && tries++ < 20) { Serial.print("."); delay(500); }
  Serial.println(tries < 20 ? " OK" : " (no NTP)");

  // ── Firebase ─────────────────────────────────────────────────────────────
  initFirebase();

  digitalWrite(PIN_STATUS, HIGH);
  Serial.println("Ready — uploading every " + String(UPLOAD_INTERVAL_S) + "s");
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────────────────

void loop() {
  // Required: pump the async Firebase task queue
  app.loop();

  uint32_t now = millis();
  if (now - lastUpMs >= (uint32_t)UPLOAD_INTERVAL_S * 1000UL) {
    lastUpMs = now;
    uploadReading();
  }

  delay(10);
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIREBASE INIT  (FirebaseClient v3)
// ─────────────────────────────────────────────────────────────────────────────

void initFirebase() {
  // Skip SSL certificate verification (simplest for embedded devices).
  // For production, load the root CA cert with sslClient.setCACert(root_ca).
  sslClient.setInsecure();

  // initializeApp wires the auth + network into the async client
  initializeApp(aClient, app, getAuth(noAuth));

  // Bind the RealtimeDatabase service to this app
  app.getApp<RealtimeDatabase>(db);
  db.url(FIREBASE_DB_URL);

  Serial.println("Firebase: initialized (anonymous / no-auth)");
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPLOAD  (FirebaseClient v3)
// ─────────────────────────────────────────────────────────────────────────────

void uploadReading() {
  if (!app.ready()) {
    Serial.println("Firebase not ready — skipping upload");
    return;
  }

  // ── Geiger CPM ────────────────────────────────────────────────────────────
  uint32_t nowMs     = millis();
  uint32_t elapsedMs = nowMs - lastResetMs;

  noInterrupts();
  uint32_t pulses = geigerPulses;
  geigerPulses    = 0;
  interrupts();
  lastResetMs = nowMs;

  float elapsedMin = elapsedMs / 60000.0f;
  float cpm        = (elapsedMin > 0) ? (pulses / elapsedMin) : 0.0f;
  float usvh       = cpm * CPM_TO_USVH;

  // ── BME280 ────────────────────────────────────────────────────────────────
  float temperature = 0.0f, humidity = 0.0f, pressure = 0.0f;
  if (bmeOk) {
    temperature = bme.readTemperature();
    humidity    = bme.readHumidity();
    pressure    = bme.readPressure() / 100.0f;   // Pa → hPa
  }

  // ── Rain sensor ───────────────────────────────────────────────────────────
  float rainAvg = readRainAvg();   // 0.0 (dry) – 100.0 (wet)

  // ── Timestamp ─────────────────────────────────────────────────────────────
  String ts    = isoTimestamp();
  time_t epoch = time(nullptr);

  Serial.printf("[%s] CPM=%.1f  µSv/h=%.4f  T=%.1f°C  RH=%.1f%%  P=%.1fhPa  Rain=%.1f%%\n",
                ts.length() ? ts.c_str() : "no-time",
                cpm, usvh, temperature, humidity, pressure, rainAvg);

  // ── Build JSON payload ────────────────────────────────────────────────────
  object_t   payload;
  JsonWriter writer;

  writer.create(payload, "device_id",     string_t(deviceId.c_str()));
  writer.join(payload,   "device_status", string_t("online"));
  writer.join(payload,   "temperature",   temperature);
  writer.join(payload,   "humidity",      humidity);
  writer.join(payload,   "rain_avg",      rainAvg);
  writer.join(payload,   "cpm",           cpm);
  writer.join(payload,   "usvh",          usvh);
  writer.join(payload,   "pressure",      pressure);
  writer.join(payload,   "timestamp",     string_t(ts.c_str()));

  String basePath = "/devices/" + deviceId;

  // ── Write /latest (synchronous set) ──────────────────────────────────────
  db.set<object_t>(aClient, basePath + "/latest", payload);
  if (aClient.lastError().code() == 0) {
    Serial.println("  ✓ latest updated");
  } else {
    Serial.printf("  ✗ latest error: %s\n", aClient.lastError().message().c_str());
  }

  // ── Append to historical log keyed by Unix epoch ──────────────────────────
  if (epoch > 100000) {
    db.set<object_t>(aClient, basePath + "/readings/" + String(epoch), payload);
    if (aClient.lastError().code() == 0) {
      Serial.println("  ✓ history logged");
    } else {
      Serial.printf("  ✗ history error: %s\n", aClient.lastError().message().c_str());
    }
  }

  // ── Update online status ──────────────────────────────────────────────────
  db.set<bool>(aClient, basePath + "/status/online", true);

  object_t serverTs;
  JsonWriter tsWriter;
  tsWriter.create(serverTs, ".sv", string_t("timestamp"));
  db.set<object_t>(aClient, basePath + "/status/lastSeen", serverTs);

  blink(2);
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Returns 0.0 (dry) to 100.0 (saturated), averaged over RAIN_SAMPLES reads.
// ESP32 ADC is 12-bit (0–4095); higher raw value = more conductive = wetter.
float readRainAvg() {
  uint32_t sum = 0;
  for (int i = 0; i < RAIN_SAMPLES; i++) {
    sum += analogRead(PIN_RAIN);
    delay(5);
  }
  float raw = sum / (float)RAIN_SAMPLES;
  return (raw / 4095.0f) * 100.0f;
}

String isoTimestamp() {
  time_t now = time(nullptr);
  if (now < 100000) return "";
  struct tm ti;
  gmtime_r(&now, &ti);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &ti);
  return String(buf);
}

void blink(int n, int onMs, int offMs) {
  for (int i = 0; i < n; i++) {
    digitalWrite(PIN_STATUS, HIGH); delay(onMs);
    digitalWrite(PIN_STATUS, LOW);  delay(offMs);
  }
}
