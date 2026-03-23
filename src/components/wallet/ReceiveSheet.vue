<script setup lang="ts">
import { shallowRef, watch } from "vue";
import { toDataURL } from "qrcode";
import { Copy, QrCode } from "lucide-vue-next";
import BaseButton from "../ui/BaseButton.vue";
import { useReceive } from "../../composables/useReceive";

const { address, qrValue, copyAddress } = useReceive();
const qrCodeUrl = shallowRef("");

watch(
  qrValue,
  async (value) => {
    if (!value) {
      qrCodeUrl.value = "";
      return;
    }

    qrCodeUrl.value = await toDataURL(value, {
      margin: 1,
      width: 320,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div
      class="rounded-[28px] border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-950"
    >
      <div
        class="flex items-center justify-center rounded-[24px] border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-white"
      >
        <img
          v-if="qrCodeUrl"
          :src="qrCodeUrl"
          alt="Receive address QR"
          class="h-64 w-64 max-w-full rounded-2xl"
        />
        <div
          v-else
          class="flex h-64 w-64 items-center justify-center rounded-2xl bg-surface-100 text-surface-400"
        >
          <QrCode class="h-10 w-10" />
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-surface-200 px-4 py-3 dark:border-surface-700">
      <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-surface-400">Address</p>
      <p class="mt-2 break-all font-mono text-sm text-surface-900 dark:text-surface-100">
        {{ address }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-3">
      <BaseButton data-testid="copy-address" variant="primary" @click="copyAddress">
        <Copy class="h-4 w-4" />
        Copy address
      </BaseButton>
    </div>
  </div>
</template>
