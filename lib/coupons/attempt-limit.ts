/** Límite de intentos fallidos de cupón en el configurador (localStorage). */

export const COUPON_ATTEMPT_STORAGE_KEY = "mu-coupon-attempts-v1"
export const COUPON_ATTEMPT_MAX = 5
export const COUPON_ATTEMPT_LOCK_MS = 15 * 60 * 1000 // 15 minutos

type StoredAttempts = {
  failCount: number
  lockedUntil: number | null
}

export type CouponAttemptGate = {
  locked: boolean
  lockedUntil: number | null
  failCount: number
}

function readRaw(): StoredAttempts {
  try {
    const raw = localStorage.getItem(COUPON_ATTEMPT_STORAGE_KEY)
    if (!raw) return { failCount: 0, lockedUntil: null }
    const parsed = JSON.parse(raw) as Partial<StoredAttempts>
    const failCount = Number(parsed.failCount)
    const lockedUntil =
      parsed.lockedUntil == null ? null : Number(parsed.lockedUntil)
    return {
      failCount: Number.isFinite(failCount) && failCount > 0 ? failCount : 0,
      lockedUntil:
        lockedUntil != null && Number.isFinite(lockedUntil) ? lockedUntil : null,
    }
  } catch {
    return { failCount: 0, lockedUntil: null }
  }
}

function writeRaw(state: StoredAttempts) {
  try {
    localStorage.setItem(COUPON_ATTEMPT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore (privado / sin storage)
  }
}

function normalize(state: StoredAttempts, now = Date.now()): StoredAttempts {
  if (state.lockedUntil != null && state.lockedUntil <= now) {
    return { failCount: 0, lockedUntil: null }
  }
  return state
}

export function getCouponAttemptGate(now = Date.now()): CouponAttemptGate {
  if (typeof window === "undefined") {
    return { locked: false, lockedUntil: null, failCount: 0 }
  }
  const before = readRaw()
  const state = normalize(before, now)
  if (
    state.failCount !== before.failCount ||
    state.lockedUntil !== before.lockedUntil
  ) {
    writeRaw(state)
  }
  const locked =
    state.lockedUntil != null && state.lockedUntil > now
  return {
    locked,
    lockedUntil: locked ? state.lockedUntil : null,
    failCount: state.failCount,
  }
}

/** Registra un intento fallido (cupón inexistente / usado / inválido). */
export function recordCouponAttemptFailure(
  now = Date.now(),
): CouponAttemptGate {
  if (typeof window === "undefined") {
    return { locked: false, lockedUntil: null, failCount: 0 }
  }
  let state = normalize(readRaw(), now)
  if (state.lockedUntil != null && state.lockedUntil > now) {
    return {
      locked: true,
      lockedUntil: state.lockedUntil,
      failCount: state.failCount,
    }
  }

  const failCount = state.failCount + 1
  if (failCount >= COUPON_ATTEMPT_MAX) {
    state = {
      failCount,
      lockedUntil: now + COUPON_ATTEMPT_LOCK_MS,
    }
  } else {
    state = { failCount, lockedUntil: null }
  }
  writeRaw(state)
  return {
    locked: state.lockedUntil != null && state.lockedUntil > now,
    lockedUntil: state.lockedUntil,
    failCount: state.failCount,
  }
}

/** Limpia el contador tras un cupón válido. */
export function clearCouponAttemptFailures() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(COUPON_ATTEMPT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
