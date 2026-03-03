export function useFullscreen() {
  const isFullscreen = ref(false)

  function update() {
    isFullscreen.value = !!document.fullscreenElement
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', update)
    update()
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', update)
  })

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  return { isFullscreen, toggle }
}
