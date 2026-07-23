"use client"

import { COUPON_CLAIM_STORAGE_KEY } from "./logic"

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `mu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Token del navegador: permite reusar un cupón ya “quemado” desde el mismo device. */
export function getOrCreateCouponClaimToken(): string {
  try {
    const existing = localStorage.getItem(COUPON_CLAIM_STORAGE_KEY)?.trim()
    if (existing) return existing
    const next = randomToken()
    localStorage.setItem(COUPON_CLAIM_STORAGE_KEY, next)
    return next
  } catch {
    return randomToken()
  }
}
