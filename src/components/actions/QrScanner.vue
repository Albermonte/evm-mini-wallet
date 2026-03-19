<script setup lang="ts">
import { onMounted } from "vue";
import { X } from "lucide-vue-next";
import { useQrScanner } from "../../composables/useQrScanner";

const emit = defineEmits<{
  scanned: [value: string];
  close: [];
}>();

const { videoEl, start, stop, error } = useQrScanner({
  onScan(result) {
    stop();
    emit("scanned", result);
  },
});
void videoEl; // bound via ref="videoEl" in template

onMounted(start);

function handleClose() {
  stop();
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-label="QR code scanner"
    >
      <!-- Camera feed -->
      <video ref="videoEl" class="h-full w-full object-cover" />

      <!-- Viewfinder overlay -->
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <!-- Semi-transparent edges -->
        <div class="absolute inset-0 bg-black/50" />
        <!-- Clear cutout -->
        <div
          class="relative z-10 h-64 w-64 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
        />
      </div>

      <!-- Instruction text -->
      <div class="absolute bottom-24 left-0 right-0 z-20 text-center">
        <p class="text-sm text-white/80">Point your camera at a QR code</p>
      </div>

      <!-- Error state -->
      <div
        v-if="error"
        class="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/90 px-6"
      >
        <p class="text-center text-white">{{ error }}</p>
        <button
          type="button"
          class="rounded-lg bg-white/10 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          @click="handleClose"
        >
          Close
        </button>
      </div>

      <!-- Close button -->
      <button
        type="button"
        class="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        aria-label="Close scanner"
        @click="handleClose"
      >
        <X class="h-5 w-5" />
      </button>
    </div>
  </Teleport>
</template>
