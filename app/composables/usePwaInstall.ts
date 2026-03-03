export function usePwaInstall() {
  const canInstall = ref(false)
  let deferredPrompt: BeforeInstallPromptEvent | null = null

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null
      canInstall.value = false
    })
  })

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      deferredPrompt = null
      canInstall.value = false
    }
  }

  return { canInstall, install }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
