import { ref } from 'vue'

const toasts = ref([])
let _id = 0

export function useToast() {
  function show(msg, type = 'info', duration = 3500) {
    const id = ++_id
    toasts.value.push({ id, msg, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return {
    toasts,
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    info:    (msg) => show(msg, 'info'),
  }
}
