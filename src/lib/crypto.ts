/**
 * Web Crypto helpers for PIN-based local encryption.
 *
 * We derive an AES-GCM 256 key from the user's PIN using PBKDF2 (SHA-256,
 * 150k iterations) with a per-vault random salt. The derived key is kept in
 * memory only — never persisted.
 *
 * Storage:
 *   - VaultMeta (plaintext): salt + a "verifier" blob we use to cheaply check
 *     a PIN without trial-decrypting real data. The verifier is the encryption
 *     of a fixed well-known plaintext under the derived key; if it decrypts
 *     back to that plaintext the PIN is correct.
 *   - EncryptedBlob: per-record envelope {v, iv, ct} base64 encoded.
 *
 * Threat model: the attacker has access to the device (and therefore
 * localStorage) and tries to brute-force the PIN. A 6-digit PIN has 10^6
 * combinations; 150k PBKDF2 iterations give ~100-300ms per guess on commodity
 * hardware, making offline exhaustion measured in days rather than seconds.
 * This is deliberately a local-only defense — see settings/OpenAI warnings
 * for the network exposure story.
 */

export const VAULT_VERSION = 1 as const;
export const PBKDF2_ITERATIONS = 150_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const VERIFIER_PLAINTEXT = "monetos-vault-v1";

export interface EncryptedBlob {
  v: 1;
  iv: string; // base64, 12 bytes
  ct: string; // base64, AES-GCM ciphertext + tag
}

export interface VaultMeta {
  v: 1;
  salt: string; // base64, 16 bytes
  verifier: EncryptedBlob;
  createdAt: string; // ISO 8601
}

export class VaultLockedError extends Error {
  constructor() {
    super("Vault is locked");
    this.name = "VaultLockedError";
  }
}

// === Base64 helpers ===

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

// === Key derivation ===

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  return salt;
}

export async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// === Encrypt / decrypt JSON ===

export async function encryptJson<T>(data: T, key: CryptoKey): Promise<EncryptedBlob> {
  const iv = new Uint8Array(IV_BYTES);
  crypto.getRandomValues(iv);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return {
    v: VAULT_VERSION,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptJson<T>(blob: EncryptedBlob, key: CryptoKey): Promise<T> {
  const iv = base64ToBytes(blob.iv);
  const ct = base64ToBytes(blob.ct);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  const text = new TextDecoder().decode(plaintext);
  return JSON.parse(text) as T;
}

// === Verifier (cheap PIN check) ===

export async function computeVerifier(key: CryptoKey): Promise<EncryptedBlob> {
  return encryptJson(VERIFIER_PLAINTEXT, key);
}

/**
 * Verify a PIN against a stored VaultMeta.
 * Returns the derived CryptoKey on success, or null on failure.
 */
export async function verifyPin(pin: string, meta: VaultMeta): Promise<CryptoKey | null> {
  try {
    const salt = base64ToBytes(meta.salt);
    const key = await deriveKey(pin, salt);
    const plaintext = await decryptJson<string>(meta.verifier, key);
    if (plaintext !== VERIFIER_PLAINTEXT) return null;
    return key;
  } catch {
    return null;
  }
}

// === Vault creation helpers ===

/**
 * Create a new VaultMeta from a PIN — generates salt, derives a key, and
 * computes the verifier blob. Returns both the meta (to persist) and the
 * derived key (to keep in memory).
 */
export async function createVaultMeta(pin: string): Promise<{ meta: VaultMeta; key: CryptoKey }> {
  const salt = generateSalt();
  const key = await deriveKey(pin, salt);
  const verifier = await computeVerifier(key);
  const meta: VaultMeta = {
    v: VAULT_VERSION,
    salt: bytesToBase64(salt),
    verifier,
    createdAt: new Date().toISOString(),
  };
  return { meta, key };
}
