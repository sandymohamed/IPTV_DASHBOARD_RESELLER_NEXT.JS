import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    adminid?: string | number
    adm_username?: string
    apiToken?: string
    balance?: number
    [key: string]: any
  }

  interface Session {
    user: User & {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      adminid?: string | number
      adm_username?: string
      apiToken?: string
      balance?: number
      [key: string]: any
    }
    apiToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: any
    apiToken?: string
    adminid?: string | number
    [key: string]: any
  }
}

