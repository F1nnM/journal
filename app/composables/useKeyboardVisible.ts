export function useKeyboardVisible() {
  const keyboardVisible = ref(false)

  if (import.meta.client) {
    let fullHeight = 0

    const checkKeyboard = () => {
      keyboardVisible.value = window.innerHeight < fullHeight * 0.8
    }

    onMounted(() => {
      fullHeight = window.innerHeight
      window.visualViewport?.addEventListener('resize', checkKeyboard)
    })

    onUnmounted(() => {
      window.visualViewport?.removeEventListener('resize', checkKeyboard)
    })
  }

  return { keyboardVisible }
}
