import { describe, it, expect, beforeEach } from 'vitest'
import { tokenService } from '@/services/tokenService'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Encode un payload JWT (header.payload.signature — pas de vraie signature) */
function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-sig`
}

/** Retourne un timestamp Unix dans N secondes */
function inSeconds(n: number): number {
  return Math.floor(Date.now() / 1000) + n
}

// ── Mock localStorage ──────────────────────────────────────────────────────────

function makeLocalStorage() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('tokenService', () => {
  beforeEach(() => {
    const storage = makeLocalStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
    })
  })

  // ── setTokens / getToken / getRefreshToken ───────────────────────────────────

  describe('setTokens', () => {
    it('stocke le token et le refresh token dans localStorage', () => {
      tokenService.setTokens('tok123', 'ref456')
      expect(localStorage.getItem('kubo_token')).toBe('tok123')
      expect(localStorage.getItem('kubo_refresh_token')).toBe('ref456')
    })
  })

  describe('getToken', () => {
    it('retourne null si aucun token présent', () => {
      expect(tokenService.getToken()).toBeNull()
    })

    it('retourne le token stocké', () => {
      localStorage.setItem('kubo_token', 'my-token')
      expect(tokenService.getToken()).toBe('my-token')
    })
  })

  describe('getRefreshToken', () => {
    it('retourne null si aucun refresh token présent', () => {
      expect(tokenService.getRefreshToken()).toBeNull()
    })

    it('retourne le refresh token stocké', () => {
      localStorage.setItem('kubo_refresh_token', 'my-refresh')
      expect(tokenService.getRefreshToken()).toBe('my-refresh')
    })
  })

  // ── clearTokens ──────────────────────────────────────────────────────────────

  describe('clearTokens', () => {
    it('supprime les deux clés du localStorage', () => {
      tokenService.setTokens('tok', 'ref')
      tokenService.clearTokens()
      expect(localStorage.getItem('kubo_token')).toBeNull()
      expect(localStorage.getItem('kubo_refresh_token')).toBeNull()
    })

    it("ne lance pas d'erreur si les clés n'existent pas", () => {
      expect(() => tokenService.clearTokens()).not.toThrow()
    })
  })

  // ── isTokenExpired ───────────────────────────────────────────────────────────

  describe('isTokenExpired', () => {
    it('retourne true si aucun token fourni ni en localStorage', () => {
      expect(tokenService.isTokenExpired()).toBe(true)
    })

    it('retourne true si le token est invalide (non-JWT)', () => {
      expect(tokenService.isTokenExpired('not.a.jwt')).toBe(true)
    })

    it('retourne true si le token est expiré', () => {
      const token = makeToken({ exp: inSeconds(-100), iat: inSeconds(-200) })
      expect(tokenService.isTokenExpired(token)).toBe(true)
    })

    it('retourne true si le token expire dans moins de 30 secondes (marge proactive)', () => {
      const token = makeToken({ exp: inSeconds(20), iat: inSeconds(-100) })
      expect(tokenService.isTokenExpired(token)).toBe(true)
    })

    it('retourne false si le token expire dans plus de 30 secondes', () => {
      const token = makeToken({ exp: inSeconds(60), iat: inSeconds(-100) })
      expect(tokenService.isTokenExpired(token)).toBe(false)
    })

    it('lit le token depuis localStorage si aucun paramètre fourni', () => {
      const token = makeToken({ exp: inSeconds(120), iat: inSeconds(-100) })
      localStorage.setItem('kubo_token', token)
      expect(tokenService.isTokenExpired()).toBe(false)
    })

    it('utilise le paramètre fourni en priorité sur localStorage', () => {
      // localStorage a un token valide, mais le paramètre est expiré
      const validToken = makeToken({ exp: inSeconds(120), iat: inSeconds(-100) })
      const expiredToken = makeToken({ exp: inSeconds(-50), iat: inSeconds(-200) })
      localStorage.setItem('kubo_token', validToken)
      expect(tokenService.isTokenExpired(expiredToken)).toBe(true)
    })

    it('retourne true si le token est null explicitement', () => {
      expect(tokenService.isTokenExpired(null)).toBe(true)
    })
  })

  // ── decodePayload ────────────────────────────────────────────────────────────

  describe('decodePayload', () => {
    it('retourne null pour un token invalide (pas de point)', () => {
      expect(tokenService.decodePayload('invalid')).toBeNull()
    })

    it('retourne null pour un token avec payload non-base64 valide', () => {
      expect(tokenService.decodePayload('header.!!!.sig')).toBeNull()
    })

    it('décode correctement un payload JWT valide', () => {
      const payload = {
        email: 'user@kubo.dev',
        roles: ['ROLE_USER'],
        exp: 9999999999,
        iat: 1000000,
      }
      const token = makeToken(payload)
      const decoded = tokenService.decodePayload(token)
      expect(decoded).not.toBeNull()
      expect(decoded?.email).toBe('user@kubo.dev')
      expect(decoded?.roles).toEqual(['ROLE_USER'])
      expect(decoded?.exp).toBe(9999999999)
    })

    it('décode un payload avec username (convention Symfony)', () => {
      const payload = {
        username: 'admin@kubo.dev',
        roles: ['ROLE_ADMIN'],
        exp: 9999999999,
        iat: 1000000,
      }
      const token = makeToken(payload)
      const decoded = tokenService.decodePayload(token)
      expect(decoded?.username).toBe('admin@kubo.dev')
    })

    it('retourne null pour une chaîne vide', () => {
      expect(tokenService.decodePayload('')).toBeNull()
    })
  })
})
