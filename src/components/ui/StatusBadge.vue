<script setup lang="ts">
defineProps<{
  status: "pending" | "confirming" | "confirmed" | "failed";
}>();

const statusConfig = {
  pending: {
    label: "Pending",
    class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  confirming: {
    label: "Confirming",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  confirmed: {
    label: "Confirmed",
    class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  failed: {
    label: "Failed",
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      statusConfig[status].class,
    ]"
  >
    <span
      v-if="status === 'pending' || status === 'confirming'"
      class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
    />
    {{ statusConfig[status].label }}
  </span>
</template>
