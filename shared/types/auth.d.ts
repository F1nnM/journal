declare module '#auth-utils' {
  interface User {
    id: string
    sub: string
    name: string
    email: string
  }

  interface UserSession {
    loggedInAt: number
  }

  interface SecureSessionData {
    accessToken: string
    refreshToken?: string
  }
}

export {}
