export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  colorMode: { classSuffix: '' },
  runtimeConfig: {
    databaseUrl: '',
    session: { password: '' },
    oauth: {
      oidc: {
        clientId: '',
        clientSecret: '',
        openidConfig: '',
        redirectURL: '',
      },
    },
  },
})
