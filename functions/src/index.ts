import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onValueCreated, onValueWritten } from 'firebase-functions/v2/database';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

admin.initializeApp();

const TOMORROW_API_KEY = defineSecret('TOMORROW_API_KEY');

const FIELDS = [
  'temperature',
  'humidity',
  'windSpeed',
  'precipitationProbability',
  'weatherCode',
].join(',');

function dryingMinutes(temp: number, humidity: number, wind: number): number {
  const mins = 60 + (humidity - 50) * 0.9 - (temp - 20) * 2.5 - Math.max(0, wind - 10) * 0.6;
  return Math.round(Math.max(20, Math.min(180, mins)));
}

function condition(mins: number): string {
  if (mins <= 40) return 'excellent';
  if (mins <= 70) return 'optimal';
  if (mins <= 110) return 'fair';
  return 'poor';
}

type DeviceRecord = { id: string; latitude: number; longitude: number };

// ─── Shared forecast fetch ───────────────────────────────────────────────────
// Fetches the Tomorrow.io forecast for one device and writes it to
// weather/{device.id}/forecast. Swallows/logs its own errors so callers can
// run it for many devices in parallel without one failure aborting the rest.

async function fetchForecastForDevice(
  device: DeviceRecord,
  apiKey: string,
): Promise<void> {
  if (
    !device ||
    typeof device.latitude !== 'number' ||
    typeof device.longitude !== 'number'
  ) {
    console.error(`Skipping device with missing coordinates:`, device?.id);
    return;
  }

  try {
    const url =
      `https://api.tomorrow.io/v4/weather/forecast` +
      `?location=${device.latitude},${device.longitude}` +
      `&timesteps=1h&units=metric&fields=${FIELDS}` +
      `&apikey=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Tomorrow.io ${res.status} for device ${device.id}`);
      return;
    }
    const json = await res.json();

    const hours: any[] = json.timelines?.hourly ?? [];
    if (!hours.length) {
      console.error(`Tomorrow.io returned no hourly data for device ${device.id}`);
      return;
    }

    const now = hours[0].values;
    const temperature: number = now.temperature;
    const humidity: number = now.humidity;
    // Tomorrow.io returns windSpeed in m/s for metric units — the app shows km/h.
    const windSpeed: number = Math.round((now.windSpeed ?? 0) * 3.6 * 10) / 10;
    const weatherCode: number = now.weatherCode;

    const precipProbability = hours.slice(0, 4).map((h) =>
      Math.round(h.values.precipitationProbability ?? 0)
    );

    let rainExpected = false;
    let rainAt: string | null = null;
    let rainInHours: number | null = null;

    for (let i = 0; i < Math.min(hours.length, 12); i++) {
      if ((hours[i].values.precipitationProbability ?? 0) > 50) {
        rainExpected = true;
        rainInHours = i;
        rainAt = hours[i].time;
        break;
      }
    }

    const estimatedMinutes = dryingMinutes(temperature, humidity, windSpeed);
    const cond = condition(estimatedMinutes);

    const forecast = {
      updatedAt: new Date().toISOString(),
      temperature,
      humidity,
      windSpeed,
      weatherCode,
      rainExpected,
      rainAt,
      rainInHours,
      estimatedMinutes,
      condition: cond,
      precipProbability,
    };

    await admin.database().ref(`weather/${device.id}/forecast`).set(forecast);
    console.log(`Forecast updated for device ${device.id}`);
  } catch (err) {
    console.error(`Failed for device ${device.id}:`, err);
  }
}

// ─── Scheduled refresh — every device, every 30 minutes ──────────────────────

export const refreshWeatherForecast = onSchedule(
  { schedule: 'every 30 minutes', secrets: [TOMORROW_API_KEY] },
  async () => {
    const db = admin.database();

    // Collect all devices across all users
    const usersSnap = await db.ref('users').once('value');
    const usersVal = usersSnap.val() as Record<
      string,
      { devices?: Record<string, DeviceRecord> }
    > | null;

    console.log('Users snapshot exists:', usersSnap.exists(), '| keys:', usersVal ? Object.keys(usersVal) : []);
    if (!usersVal) return;

    const devices: DeviceRecord[] = [];
    for (const [uid, userData] of Object.entries(usersVal)) {
      console.log(`uid=${uid} has devices:`, userData.devices ? Object.keys(userData.devices) : 'none');
      if (userData.devices) {
        devices.push(...Object.values(userData.devices));
      }
    }

    console.log('Total devices to process:', devices.length);
    if (devices.length === 0) return;

    const apiKey = TOMORROW_API_KEY.value();
    await Promise.all(devices.map((device) => fetchForecastForDevice(device, apiKey)));
  }
);

// ─── On device registration — fetch that device's forecast immediately ───────

export const forecastOnDeviceCreate = onValueCreated(
  { ref: '/users/{uid}/devices/{deviceId}', secrets: [TOMORROW_API_KEY] },
  async (event) => {
    const device = event.data.val() as DeviceRecord | null;
    if (!device) return;
    console.log(`New device ${event.params.deviceId} for uid ${event.params.uid} — fetching forecast`);
    await fetchForecastForDevice(device, TOMORROW_API_KEY.value());
  }
);

// ─── Push notification on device_status change ───────────────────────────────
// Fires when devices/{deviceId}/latest/device_status changes, and pushes to
// every mobile linked to that device. "Linked" = the deviceId appears under
// users/{uid}/devices (option A: scan users, no reverse index maintained).
// FCM tokens live at users/{uid}/pushTokens/{token} (written by the app).

function humanizeStatus(status: string): string {
  const s = status.trim();
  if (!s) return 'updated';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

const PRUNE_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export const notifyOnDeviceStatus = onValueWritten(
  '/devices/{deviceId}/latest/device_status',
  async (event) => {
    const before = event.data.before.val() as string | null;
    const after = event.data.after.val() as string | null;

    if (after == null || after === before) return;

    const { deviceId } = event.params;
    const db = admin.database();

    const usersSnap = await db.ref('users').once('value');
    const usersVal = usersSnap.val() as Record<
      string,
      {
        devices?: Record<string, unknown>;
        pushTokens?: Record<string, unknown>;
      }
    > | null;
    if (!usersVal) return;

    // token -> set of uids that hold it (for targeted cleanup on failure)
    const tokenOwners = new Map<string, Set<string>>();
    for (const [uid, userData] of Object.entries(usersVal)) {
      if (!userData.devices || !(deviceId in userData.devices)) continue;
      for (const token of Object.keys(userData.pushTokens ?? {})) {
        const owners = tokenOwners.get(token) ?? new Set<string>();
        owners.add(uid);
        tokenOwners.set(token, owners);
      }
    }

    const tokens = [...tokenOwners.keys()];
    if (tokens.length === 0) {
      console.log(`device_status ${deviceId}: no linked push tokens`);
      return;
    }

    const status = humanizeStatus(after);
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'Shield status changed',
        body: `${deviceId} is now ${status}`,
      },
      data: {
        deviceId,
        device_status: after,
        type: 'device_status',
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    console.log(
      `device_status ${deviceId} → ${after}: sent ${response.successCount}/${tokens.length}`
    );

    // Prune tokens FCM rejected as permanently invalid.
    const removals: Promise<unknown>[] = [];
    response.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code ?? '';
      console.warn(`push failed for token ${i}: ${code}`);
      if (!PRUNE_ERROR_CODES.has(code)) return;
      const token = tokens[i];
      for (const uid of tokenOwners.get(token) ?? []) {
        removals.push(db.ref(`users/${uid}/pushTokens/${token}`).remove());
      }
    });
    await Promise.all(removals);
  }
);
