import type { PersistStorage, StorageValue } from "zustand/middleware";

const STORAGE_KEY = "pf_store";
const PBKDF2_ITERATIONS = 100_000;

// ── Session key cache ──────────────────────────────────────────────
let cachedPassword: string | null = null;
let cachedKey: CryptoKey | null = null;
let cachedSalt: Uint8Array | null = null;

export function setCachedPassword(pw: string) {
  cachedPassword = pw;
  // Don't derive key yet — we derive lazily on first use and cache after success
  cachedKey = null;
  cachedSalt = null;
}

export function getCachedPassword(): string | null {
  return cachedPassword;
}

export function clearCachedPassword() {
  cachedPassword = null;
  cachedKey = null;
  cachedSalt = null;
}

// ── Crypto helpers (Web Crypto API) ────────────────────────────────
function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function getOrDeriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Reuse cached key if password and salt match
  if (
    cachedKey &&
    cachedPassword === password &&
    cachedSalt &&
    cachedSalt.length === salt.length &&
    cachedSalt.every((b, i) => b === salt[i])
  ) {
    return cachedKey;
  }
  const key = await deriveKey(password, salt);
  return key; // Caller decides whether to cache
}

interface EncryptedPayload {
  iv: string;
  salt: string;
  ciphertext: string;
}

async function encrypt(
  data: string,
  password: string
): Promise<EncryptedPayload> {
  const salt = cachedSalt ?? crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Fresh IV every write
  const key = await getOrDeriveKey(password, salt);

  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(data) as BufferSource
  );

  // Cache after successful encrypt
  cachedKey = key;
  cachedSalt = salt;

  return {
    iv: toBase64(iv.buffer as ArrayBuffer),
    salt: toBase64(salt.buffer as ArrayBuffer),
    ciphertext: toBase64(cipherBuf),
  };
}

async function decrypt(
  payload: EncryptedPayload,
  password: string
): Promise<string> {
  const iv = fromBase64(payload.iv);
  const salt = fromBase64(payload.salt);
  const ciphertext = fromBase64(payload.ciphertext);

  const key = await getOrDeriveKey(password, salt);

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  // Only cache key AFTER successful decryption
  cachedKey = key;
  cachedSalt = salt;

  return new TextDecoder().decode(plainBuf);
}

// ── Format detection ───────────────────────────────────────────────
function isEncryptedPayload(obj: unknown): obj is EncryptedPayload {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "iv" in obj &&
    "salt" in obj &&
    "ciphertext" in obj
  );
}

// ── Public utilities ───────────────────────────────────────────────

export function hasExistingData(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function isDataEncrypted(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return isEncryptedPayload(parsed);
  } catch {
    return false;
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!isEncryptedPayload(parsed)) return false;
    await decrypt(parsed, pin);
    return true;
  } catch {
    return false;
  }
}

export async function enableEncryption(pin: string): Promise<void> {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  // Reset key cache for new password
  cachedKey = null;
  cachedSalt = null;
  cachedPassword = pin;

  const payload = await encrypt(raw, pin);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function disableEncryption(): Promise<void> {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw || !cachedPassword) return;
  try {
    const parsed = JSON.parse(raw);
    if (!isEncryptedPayload(parsed)) return;
    const plaintext = await decrypt(parsed, cachedPassword);
    localStorage.setItem(STORAGE_KEY, plaintext);
    clearCachedPassword();
  } catch {
    // If decryption fails, don't corrupt data
  }
}

export async function triggerRehydration(): Promise<void> {
  // Dynamic import to avoid circular dependency (encrypted-storage ↔ app-store)
  const { useAppStore } = await import("./app-store");
  await useAppStore.persist.rehydrate();
}

// ── Zustand PersistStorage adapter ─────────────────────────────────

export function createEncryptedStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(name);
      if (!raw) return null;

      try {
        const parsed = JSON.parse(raw);

        if (isEncryptedPayload(parsed)) {
          if (!cachedPassword) return null; // Can't decrypt without password
          const plaintext = await decrypt(parsed, cachedPassword);
          return JSON.parse(plaintext) as StorageValue<T>;
        }

        // Plaintext format
        return parsed as StorageValue<T>;
      } catch {
        return null;
      }
    },

    setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
      if (typeof window === "undefined") return;
      const json = JSON.stringify(value);

      if (cachedPassword) {
        const payload = await encrypt(json, cachedPassword);
        localStorage.setItem(name, JSON.stringify(payload));
      } else {
        localStorage.setItem(name, json);
      }
    },

    removeItem: (name: string): void => {
      if (typeof window === "undefined") return;
      localStorage.removeItem(name);
    },
  };
}
