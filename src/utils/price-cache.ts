type PriceMap = Record<string, number | null>;

interface CachedPrices {
  prices: PriceMap;
  fetchedAt: number;
}

const DB_NAME = "evm-mini-wallet";
const STORE_NAME = "price-cache";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function cacheKey(chainId: number, vsCurrency: string): string {
  return `${chainId}:${vsCurrency}`;
}

export async function getCachedPrices(
  chainId: number,
  vsCurrency: string,
): Promise<PriceMap | null> {
  try {
    const db = await openDb();
    const entry = await new Promise<CachedPrices | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(cacheKey(chainId, vsCurrency));
      request.onsuccess = () => resolve(request.result as CachedPrices | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();

    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > ONE_DAY_MS) return null;
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
    const db = await openDb();

    // Merge with existing cached prices so tokens that are no longer queried
    // keep their cached value until the whole entry expires.
    const existing = await new Promise<CachedPrices | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(cacheKey(chainId, vsCurrency));
      request.onsuccess = () => resolve(request.result as CachedPrices | undefined);
      request.onerror = () => reject(request.error);
    });

    const merged: PriceMap = { ...existing?.prices, ...prices };
    const entry: CachedPrices = { prices: merged, fetchedAt: Date.now() };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const request = tx.objectStore(STORE_NAME).put(entry, cacheKey(chainId, vsCurrency));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch {
    // Silently fail – cache is best-effort
  }
}
