import { push, ref, set } from 'firebase/database';

import { firebaseAuth, firebaseDatabase } from '@/lib/firebase';

export type CommandAction = 'deploy' | 'retract';

export async function sendCommand(deviceId: string, action: CommandAction): Promise<void> {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  const issuedAt = new Date().toISOString();
  await set(ref(firebaseDatabase, `commands/${deviceId}`), { action, issuedAt, issuedBy: uid });
  await push(ref(firebaseDatabase, `history/${deviceId}`), { action, issuedAt, issuedBy: uid, source: 'manual' });
}
