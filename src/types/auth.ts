export type UserRole = 'visitor' | 'user' | 'admin'

export interface JwtPayload {
  iat: number
  exp: number
  roles: string[]
  username?: string // champ standard LexikJWT
  email?: string // certaines configs Symfony l'exposent sous ce nom
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface AuthTokens {
  token: string
  refresh_token: string
}
