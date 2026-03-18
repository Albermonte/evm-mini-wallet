import { onScopeDispose, ref } from "vue";

export function useClipboard() {
  const copied = ref(false);
  let timer: ReturnType<typeof setTimeout>;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        copied.value = false;
      }, 2000);
    } catch {
      copied.value = false;
    }
  }

  onScopeDispose(() => clearTimeout(timer));

  return { copied, copy };
}
