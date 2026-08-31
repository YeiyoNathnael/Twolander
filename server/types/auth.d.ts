declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    avatar?: string | null
    coupleId?: string | null
    color: 'coral' | 'teal'
  }
}
export {}
