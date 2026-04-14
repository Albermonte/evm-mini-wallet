type PriceMap = Record<string, number | null>;

interface CachedPrices {
  prices: PriceMap;
  fetchedAt: number;
}

const DB_NAME = "evm-mini-wallet";
const STORE_NAME = "price-cache";
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

function cacheKey(chainId: number, vsCurrency: string): string {
  return `${chainId}:${vsCurrency}`;
}

export async function getCachedPrices(
  chainId: number,
  vsCurrency: string,
): Promise<PriceMap | null> {
  try {
    const db = await getDb();
    const entry = await new Promise<CachedPrices | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(cacheKey(chainId, vsCurrency));
      request.onsuccess = () => resolve(request.result as CachedPrices | undefined);
      request.onerror = () => reject(request.error);
    });

    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > TWELVE_HOURS_MS) return null;
    return entry.prices;
  } catch {
    return null;
  }
}

export async function setCachedPrices(
  chainId: number,
  vsCurrency: string,
  prices: PriceMap,
): Promise<void> {
  try {
    const db = await getDb();
    const key = cacheKey(chainId, vsCurrency);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);

      getReq.onsuccess = () => {
        const existing = getReq.result as CachedPrices | undefined;
        const merged: PriceMap = { ...existing?.prices, ...prices };
        const entry: CachedPrices = { prices: merged, fetchedAt: Date.now() };
        const putReq = store.put(entry, key);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    // Silently fail – cache is best-effort
  }
}
