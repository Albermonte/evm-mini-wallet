// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("App", () => {
  async function renderApp(isConnected: boolean) {
    vi.doMock("@wagmi/vue", () => ({
      useConnection: () => ({
        isConnected: ref(isConnected),
      }),
    }));

    vi.doMock("reka-ui", () => ({
      ToastProvider: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      TooltipProvider: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      DialogRoot: defineComponent({
        props: { open: Boolean },
        emits: ["update:open"],
        setup(props, { slots, emit }) {
          return () =>
            h("div", [
              slots.default?.(),
              h("button", {
                "data-testid": "dialog-toggle",
                onClick: () => emit("update:open", !props.open),
              }),
            ]);
        },
      }),
      DialogPortal: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      DialogOverlay: defineComponent({
        setup() {
          return () => h("div", { "data-testid": "dialog-overlay" });
        },
      }),
      DialogContent: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      DialogTitle: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      DialogClose: defineComponent({
        setup(_p, { slots }) {
          return () => h("button", { "data-testid": "dialog-close" }, slots.default?.());
        },
      }),
      TabsRoot: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      TabsList: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
      TabsTrigger: defineComponent({
        props: { value: String },
        setup(props, { slots }) {
          return () => h("button", { "data-value": props.value }, slots.default?.());
        },
      }),
      TabsContent: defineComponent({
        props: { value: String },
        setup(props, { slots }) {
          return () => h("section", { "data-value": props.value }, slots.default?.());
        },
      }),
    }));

    vi.doMock("motion-v", () => ({
      Motion: defineComponent({
        setup(_p, { slots }) {
          return () => h("div", slots.default?.());
        },
      }),
    }));

    const { default: App } = await import("./App.vue");
    const wrapper = mount(App, {
      global: {
        stubs: {
          AppHeader: { template: '<div data-testid="app-header" />' },
          ConnectWallet: { template: '<div data-testid="connect-wallet" />' },
          BalanceDisplay: { template: '<div data-testid="balance-display" />' },
          TokenList: { template: '<div data-testid="token-list" />' },
          SendTransaction: { template: '<div data-testid="send-transaction" />' },
          TransactionList: { template: '<div data-testid="transaction-list" />' },
          BaseButton: {
            template: '<button data-testid="base-button"><slot /></button>',
          },
          Toast: { template: '<div data-testid="toast" />' },
        },
      },
    });

    return wrapper;
  }

  it("renders the disconnected shell when the wallet is not connected", async () => {
    const wrapper = await renderApp(false);

    expect(wrapper.find('[data-testid="connect-wallet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="balance-display"]').exists()).toBe(false);
  });

  it("renders the connected tabs and send sheet content", async () => {
    const wrapper = await renderApp(true);

    expect(wrapper.find('[data-testid="balance-display"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="token-list"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="transaction-list"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="send-transaction"]').exists()).toBe(true);
  });
});
