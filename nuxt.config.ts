export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode', '@vite-pwa/nuxt'],
  colorMode: { classSuffix: '' },
  build: {
    transpile: ['nuxt'],
  },
  runtimeConfig: {
    databaseUrl: '',
    session: {
      password: '',
      cookie: {
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    },
    oauth: {
      oidc: {
        clientId: '',
        clientSecret: '',
        openidConfig: '',
        redirectURL: '',
      },
    },
    public: {},
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Journal',
      short_name: 'Journal',
      description: 'A minimalist personal journal',
      theme_color: '#1c1917',
      background_color: '#1c1917',
      display: 'standalone',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: undefined,
    },
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },
})
