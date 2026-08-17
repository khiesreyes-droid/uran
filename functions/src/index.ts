import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

admin.initializeApp();

const TOMORROW_API_KEY = defineSecret('TOMORROW_API_KEY');

const LAT = 14.5995;     // ← your latitude
const LON = 120.9842;    // ← your longitude
const TZ  = 'Asia/Manila';

export const refreshWeatherForecast = onSchedule(
  { schedule: 'every 30 minutes', secrets: [TOMORROW_API_KEY] },
  async () => {
    const key = TOMORROW_API_KEY.value();
    const url =
      `https://api.tomorrow.io/v4/weather/forecast` +
      `?location=${LAT},${LON}&timesteps=1h&units=metric` +
      `&fields=temperature,humidity,windSpeed,precipitationProbability,weatherCode` +
      `&apikey=${key}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Tomorrow.io ${res.status}`);
    const data = await res.json();

    const hourly: Array<{ time: string; values: Record<string, number> }> =
      data.timelines?.hourly ?? [];
    if (!hourly.length) throw new Error('No hourly data');

    const cur = hourly[0].values;
    const temp      = Math.round(cur.temperature ?? 0);
    const humidity  = Math.round(cur.humidity    ?? 0);
    const wind      = Math.round(cur.windSpeed   ?? 0);
    const weatherCode = cur.weatherCode ?? 1000;

    const precipProbability = hourly
      .slice(0, 6)
      .map(h => Math.round(h.values.precipitationProbability ?? 0));

    const rainIndex = precipProbability.findIndex(p => p > 50);
    const rainExpected = rainIndex !== -1;
    let rainTime: string | null = null;
    let rainInHours: number | null = null;

    if (rainExpected) {
      rainInHours = rainIndex + 1;
      const rainDate = new Date(hourly[rainIndex].time);
      rainTime = rainDate.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ,
      });
    }

    let minutes = 60;
    minutes += (humidity - 50) * 0.9;
    minutes -= (temp - 20) * 2.5;
    minutes -= Math.max(0, wind - 10) * 0.6;
    minutes = Math.round(Math.max(20, Math.min(180, minutes)));

    let condition: string;
    let conditionText: string;
    if (rainExpected) {
      condition = 'poor';
      conditionText = `Rain likely around ${rainTime} — retract laundry before then.`;
    } else if (minutes <= 40) {
      condition = 'excellent';
      conditionText = 'Excellent — hot, breezy, low humidity. Fast drying.';
    } else if (minutes <= 65) {
      condition = 'optimal';
      conditionText = 'Optimal conditions detected for cotton garments.';
    } else if (minutes <= 100) {
      condition = 'fair';
      conditionText = 'Fair conditions — moderate drying expected.';
    } else {
      condition = 'poor';
      conditionText = 'High humidity — consider indoor drying today.';
    }

    await admin.database().ref('weather/forecast').set({
      updatedAt: new Date().toISOString(),
      temperature: temp,
      humidity,
      windSpeed: wind,
      weatherCode,
      rainExpected,
      rainTime,
      rainInHours,
      estimatedMinutes: minutes,
      condition,
      conditionText,
      precipProbability: precipProbability.slice(0, 4),
    });

    console.log(`Done. rainExpected=${rainExpected} rainTime=${rainTime}`);
  }
);