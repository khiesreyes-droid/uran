import type { PushToken } from '@/lib/notifications';

import { ref, remove, serverTimestamp, set } from 'firebase/database';
import { firebaseAuth, firebaseDatabase } from '@/lib/firebase';
import { storage } from '@/lib/storage';

// Remember the last token we registered so we can clean it up on sign-out,
// when firebaseAuth.currentUser is about to become null.
const LAST_TOKEN_KEY = 'push-token:last';
const LAST_UID_KEY = 'push-token:uid';

// RTDB keys may not contain '.', '#', '$', '[', ']' or '/'. Modern FCM/APNs
// tokens only use [A-Za-z0-9_:-], but guard anyway.
function isSafeKey(token: string): boolean {
  return !/[.#$[\]/]/.test(token);
}

export async function savePushToken({ token, platform }: PushToken): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) {
    console.warn('[push] savePushToken: no authenticated user');
    return;
  }
  if (!isSafeKey(token)) {
    console.warn('[push] savePushToken: token has RTDB-unsafe chars, skipping');
    return;
  }

  try {
    await set(ref(firebaseDatabase, `users/${uid}/pushTokens/${token}`), {
      platform,
      updatedAt: serverTimestamp(),
    });
    console.log('[push] token saved to users/%s/pushTokens', uid);
  }
  catch (err) {
    console.error('[push] savePushToken write failed:', err);
    throw err;
  }

  storage.set(LAST_TOKEN_KEY, token);
  storage.set(LAST_UID_KEY, uid);
}

/**
 * Best-effort removal of this device's token. Call *before* Firebase sign-out
 * while the user is still authenticated (RTDB rules will reject the write once
 * currentUser is null).
 */
export async function unregisterPushToken(): Promise<void> {
  const token = storage.getString(LAST_TOKEN_KEY);
  const uid = storage.getString(LAST_UID_KEY) ?? firebaseAuth.currentUser?.uid;
  if (!token || !uid)
    return;

  try {
    await remove(ref(firebaseDatabase, `users/${uid}/pushTokens/${token}`));
  }
  catch {
    // ignore — the Cloud Function prunes stale tokens on send failure anyway
  }
  finally {
    storage.remove(LAST_TOKEN_KEY);
    storage.remove(LAST_UID_KEY);
  }
}
