// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vite-plus/test";

type CachedPrices = {
  prices: Record<string, number | null>;
  fetchedAt: number;
};

function createIndexedDbMock(entries: Record<string, CachedPrices>) {
  const store = new Map(Object.entries(entries));

  return {
    open: vi.fn(() => {
      const request: {
        result?: {
          createObjectStore: (name: string) => void;
          transaction: (
            name: string,
            mode: string,
          ) => {
            objectStore: (storeName: string) => {
              get: (key: string) => {
                onsuccess: null | (() => void);
                onerror: null | (() => void);
                result?: CachedPrices;
                error?: Error;
              };
              put: (
                value: CachedPrices,
                key: string,
              ) => {
                onsuccess: null | (() => void);
                onerror: null | (() => void);
                error?: Error;
              };
            };
          };
        };
        onupgradeneeded: null | (() => void);
        onsuccess: null | (() => void);
        onerror: null | (() => void);
        error?: Error;
      } = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      };

      request.result = {
        createObjectStore: () => undefined,
        transaction: () => ({
          objectStore: () => ({
            get: (key: string) => {
              const getRequest: {
                onsuccess: null | (() => void);
                onerror: null | (() => void);
                result?: CachedPrices;
                error?: Error;
              } = {
                onsuccess: null,
                onerror: null,
              };

              queueMicrotask(() => {
                getRequest.result = store.get(key);
                getRequest.onsuccess?.();
              });

              return getRequest;
            },
            put: (value: CachedPrices, key: string) => {
              const putRequest: {
                onsuccess: null | (() => void);
                onerror: null | (() => void);
                error?: Error;
              } = {
                onsuccess: null,
                onerror: null,
              };

              queueMicrotask(() => {
                store.set(key, value);
                putRequest.onsuccess?.();
              });

              return putRequest;
            },
          }),
        }),
      };

      queueMicrotask(() => {
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });

      return request;
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("getCachedPrices", () => {
  it("treats entries older than 12 hours as stale", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-14T12:00:00.000Z"));

    vi.stubGlobal(
      "indexedDB",
      createIndexedDbMock({
        "137:usd": {
          prices: {
            "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": 1,
          },
          fetchedAt: Date.now() - 13 * 60 * 60 * 1000,
        },
      }),
    );

    const { getCachedPrices } = await import("./price-cache");

    await expect(getCachedPrices(137, "usd")).resolves.toBeNull();
  });
});
