<script setup lang="ts">
import { computed, useAttrs, useId } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label?: string;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}>();

const model = defineModel<string>({ default: "" });
const attrs = useAttrs();
const generatedId = useId();

const textareaId = computed(() => (attrs.id as string | undefined) ?? generatedId);
const describedBy = computed(() => {
  const ids = [
    attrs["aria-describedby"] as string | undefined,
    props.error ? `${textareaId.value}-error` : undefined,
  ].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
});
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      :for="textareaId"
      class="text-sm font-medium text-surface-700 dark:text-surface-300"
    >
      {{ label }}
    </label>
    <textarea
      v-model="model"
      v-bind="attrs"
      :id="textareaId"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows ?? 4"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="[
        'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-colors outline-none resize-y dark:bg-surface-900',
        error
          ? 'border-red-400 focus:border-red-500 dark:border-red-500'
          : 'border-surface-300 focus:border-surface-900 dark:border-surface-600 dark:focus:border-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'placeholder:text-surface-400 dark:placeholder:text-surface-500',
      ]"
    />
    <p v-if="error" :id="`${textareaId}-error`" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
