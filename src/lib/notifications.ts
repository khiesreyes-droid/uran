import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Foreground presentation — show the banner + play sound even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'device-status';

/**
 * Android requires an explicit channel before any notification can be shown.
 * Safe to call repeatedly — createChannel is idempotent.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android')
    return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Device status',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export type PushToken = {
  token: string;
  platform: 'android' | 'ios';
};

/**
 * Requests notification permission and returns the *raw device push token*:
 *  - Android → an FCM registration token (works directly with admin.messaging()).
 *  - iOS     → an APNs token. Delivering to it via the Admin SDK needs an FCM
 *              token (react-native-firebase); until then iOS is registered but
 *              won't receive these pushes.
 * Returns null when running on a simulator or when permission is denied.
 */
export async function registerForPushNotificationsAsync(): Promise<PushToken | null> {
  if (!Device.isDevice)
    return null;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted')
    return null;

  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return { token: data, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
  }
  catch {
    return null;
  }
}

export { Notifications };
