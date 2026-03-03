export function useKeyboardVisible() {
  const keyboardVisible = ref(false)

  if (import.meta.client) {
    const viewport = window.visualViewport

    if (viewport) {
      const checkKeyboard = () => {
        keyboardVisible.value = viewport.height < window.innerHeight * 0.8
      }

      onMounted(() => {
        viewport.addEventListener('resize', checkKeyboard)
      })

      onUnmounted(() => {
        viewport.removeEventListener('resize', checkKeyboard)
      })
    }
  }

  return { keyboardVisible }
}
