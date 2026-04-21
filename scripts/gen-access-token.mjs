#!/usr/bin/env node
/**
 * Genera token corto (6 chars base62) + hash SHA-256 para `access.tokenHash`.
 *
 * Uso:
 *   node scripts/gen-access-token.mjs
 *   node scripts/gen-access-token.mjs MI6TOK
 */

import crypto from "crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const TOKEN_LEN = 6

function randomToken() {
  let out = ""
  const bytes = crypto.randomBytes(TOKEN_LEN)
  for (let i = 0; i < TOKEN_LEN; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

function isValidToken(token) {
  return typeof token === "string" && /^[A-Za-z0-9]{6}$/.test(token)
}

const input = process.argv[2]
const token = input || randomToken()

if (!isValidToken(token)) {
  console.error("Token inválido. Debe tener exactamente 6 caracteres alfanuméricos (A-Z a-z 0-9).")
  process.exit(1)
}

const hash = crypto.createHash("sha256").update(token).digest("hex")

console.log(`token: ${token}`)
console.log(`sha256: ${hash}`)
console.log("")
console.log("Pegar en JSON:")
console.log(
  JSON.stringify(
    {
      access: {
        tokenEnabled: true,
        tokenHash: hash,
      },
    },
    null,
    2,
  ),
)
