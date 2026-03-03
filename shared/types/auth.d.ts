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

}

export {}
