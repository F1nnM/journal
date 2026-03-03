export function useAutoSave(saveFn: () => Promise<void>, delay = 500) {
  const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

  let timer: ReturnType<typeof setTimeout> | null = null
  let savedTimer: ReturnType<typeof setTimeout> | null = null
  let pending = false
  let saving = false
  let saveAgain = false

  async function doSave() {
    pending = false
    timer = null

    if (saving) {
      saveAgain = true
      return
    }

    saving = true
    status.value = 'saving'

    try {
      await saveFn()
      status.value = 'saved'

      if (savedTimer) clearTimeout(savedTimer)
      savedTimer = setTimeout(() => {
        if (status.value === 'saved') {
          status.value = 'idle'
        }
        savedTimer = null
      }, 2000)
    } catch {
      status.value = 'error'
    } finally {
      saving = false
      if (saveAgain) {
        saveAgain = false
        await doSave()
      }
    }
  }

  function debouncedSave() {
    pending = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(doSave, delay)
  }

  async function immediateSave() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (pending || saving) {
      await doSave()
    }
  }

  if (import.meta.client) {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        immediateSave()
      }
    }

    onMounted(() => {
      document.addEventListener('visibilitychange', onVisibilityChange)
    })

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (timer) clearTimeout(timer)
      if (savedTimer) clearTimeout(savedTimer)
    })
  }

  return { status: readonly(status), debouncedSave, immediateSave }
}
