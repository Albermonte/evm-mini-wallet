// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("ConnectWallet", () => {
  async function renderConnectWallet(options?: {
    providers?: Array<{
      info: { uuid: string; name: string; icon: string; rdns: string };
      provider: object;
    }>;
    isPending?: boolean;
    connectError?: { message: string; code?: number };
  }) {
    const addToast = vi.fn();
    const connect = vi.fn(
      (
        _params: unknown,
        callbacks?: {
          onError?: (error: { message: string; code?: number }) => void;
        },
      ) => {
        if (options?.connectError) {
          callbacks?.onError?.(options.connectError);
        }
      },
    );

    vi.doMock("@wagmi/vue", () => ({
      useChainId: () => ref(8453),
      useConnect: () => ({
        connect,
        isPending: ref(options?.isPending ?? false),
      }),
      useSwitchChain: () => ({
        chains: [
          { id: 8453, name: "Base" },
          { id: 1, name: "Ethereum" },
        ],
      }),
    }));

    vi.doMock("@wagmi/vue/connectors", () => ({
      injected: vi.fn(({ target }) => ({ target })),
    }));

    vi.doMock("../../composables/useToast", () => ({
      useToast: () => ({ addToast }),
    }));

    vi.doMock("../../composables/useEip6963", () => ({
      useEip6963Providers: () => ({
        providers: ref(
          options?.providers ?? [
            {
              info: {
                uuid: "wallet-1",
                name: "Alpha Wallet",
                icon: "alpha.png",
                rdns: "com.alpha.wallet",
              },
              provider: {},
            },
          ],
        ),
      }),
    }));

    const { default: ConnectWallet } = await import("./ConnectWallet.vue");
    const wrapper = mount(ConnectWallet);

    return { wrapper, addToast, connect };
  }

  it("shows the empty state when no providers are detected", async () => {
    const { wrapper } = await renderConnectWallet({ providers: [] });

    expect(wrapper.text()).toContain("No wallet detected.");
  });

  it("renders detected providers and supported chains", async () => {
    const { wrapper } = await renderConnectWallet();

    expect(wrapper.text()).toContain("Alpha Wallet");
    expect(wrapper.text()).toContain("Base");
    expect(wrapper.text()).toContain("Ethereum");
  });

  it("disables the connect buttons while a connection is pending", async () => {
    const { wrapper } = await renderConnectWallet({ isPending: true });

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
  });

  it("toasts user rejection errors as informational", async () => {
    const { wrapper, addToast } = await renderConnectWallet({
      connectError: { message: "Rejected", code: 4001 },
    });

    await wrapper.get("button").trigger("click");

    expect(addToast).toHaveBeenCalledWith("Connection rejected", "info");
  });

  it("toasts generic connection errors", async () => {
    const { wrapper, addToast } = await renderConnectWallet({
      connectError: { message: "RPC unavailable" },
    });

    await wrapper.get("button").trigger("click");

    expect(addToast).toHaveBeenCalledWith("RPC unavailable", "error");
  });
});
