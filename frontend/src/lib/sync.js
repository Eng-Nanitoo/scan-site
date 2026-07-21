import { saveCards, getQueue, clearQueue, removeFromQueue, saveSettings } from './offlineDb';

export async function syncCardsFromServer(token) {
  try {
    const res = await fetch('/api/cards', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const cards = await res.json();
    await saveCards(cards);
    return true;
  } catch {
    return false;
  }
}

export async function syncSettingsFromServer() {
  try {
    const res = await fetch('/api/cards/settings');
    if (!res.ok) return false;
    const settings = await res.json();
    await saveSettings(settings);
    return true;
  } catch {
    return false;
  }
}

export async function syncQueuedScans(token) {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0, failed = 0;
  for (const item of queue) {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ unique_key: item.unique_key })
      });
      if (res.ok) {
        synced++;
        await removeFromQueue(item.id);
      } else {
        failed++;
        await removeFromQueue(item.id);
      }
    } catch {
      failed++;
      break;
    }
  }

  if (synced > 0 || queue.length > 0) {
    await syncCardsFromServer(token);
  }

  return { synced, failed };
}
