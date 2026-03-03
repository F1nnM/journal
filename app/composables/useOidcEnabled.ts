export function useOidcEnabled() {
  return useState('oidcEnabled', () => {
    if (import.meta.server) {
      return !!useRuntimeConfig().oauth.oidc.clientId
    }
    return false
  })
}
