// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import StatusBadge from "./StatusBadge.vue";

describe("StatusBadge", () => {
  it("renders the expected label for each status", () => {
    const statuses = {
      pending: "Pending",
      confirming: "Confirming",
      confirmed: "Confirmed",
      failed: "Failed",
    } as const;

    for (const [status, label] of Object.entries(statuses)) {
      const wrapper = mount(StatusBadge, {
        props: {
          status: status as keyof typeof statuses,
        },
      });

      expect(wrapper.text()).toContain(label);
    }
  });

  it("shows the pulse indicator only for pending states", () => {
    const pending = mount(StatusBadge, { props: { status: "pending" } });
    const confirming = mount(StatusBadge, { props: { status: "confirming" } });
    const confirmed = mount(StatusBadge, { props: { status: "confirmed" } });

    expect(pending.find(".animate-pulse").exists()).toBe(true);
    expect(confirming.find(".animate-pulse").exists()).toBe(true);
    expect(confirmed.find(".animate-pulse").exists()).toBe(false);
  });
});
