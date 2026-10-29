import {createAsyncStorage} from '@react-native-async-storage/async-storage';

/**
 * Small JSON wrapper over the app's on-device key-value store: the last page
 * read, favourite topics and the daily reminder times.
 */
const storage = createAsyncStorage('pdfbook');

export async function loadJSON(key, fallback) {
  try {
    const value = await storage.getItem(key);
    return value == null ? fallback : JSON.parse(value);
  } catch (e) {
    console.log('loadJSON failed', key, e);
    return fallback;
  }
}

// Writes run one after another: two quick saves of the same key could
// otherwise land out of order and leave the older value stored.
let writes = Promise.resolve();

export function saveJSON(key, value) {
  const json = JSON.stringify(value);
  writes = writes
    .then(() => storage.setItem(key, json))
    .catch((e) => console.log('saveJSON failed', key, e));
  return writes;
}
