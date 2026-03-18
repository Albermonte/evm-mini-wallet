import { ref } from "vue";

export interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  duration: number;
}

let nextId = 0;
const toasts = ref<ToastItem[]>([]);

export function useToast() {
  function addToast(message: string, type: ToastItem["type"] = "info", duration = 4000) {
    const id = nextId++;
    toasts.value.push({ id, message, type, duration });
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return { toasts, addToast, removeToast };
}
