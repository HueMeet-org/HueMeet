import { EncryptedMessage, ExportedKeys, KeyPair } from "@/types/encryption"

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey"]
  )

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey
  }
}

// Export to store/transmit
export async function exportKeys(keyPair: KeyPair): Promise<ExportedKeys> {
  // Export private key (PKCS8 format)
  const privateKeyBuffer = await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  )
  const privateKeyBase64 = btoa(
    String.fromCharCode(...new Uint8Array(privateKeyBuffer))
  )

  // Export public key (Raw format)
  const publicKeyBuffer = await crypto.subtle.exportKey(
    "raw",
    keyPair.publicKey
  )
  const publicKeyBase64 = btoa(
    String.fromCharCode(...new Uint8Array(publicKeyBuffer))
  )

  return {
    privateKey: privateKeyBase64,
    publicKey: publicKeyBase64
  }
}

export async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  )
}

export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  )
}

/**
 * Derive shared secret for a specific conversation
 * This creates a DIFFERENT key for each person you chat with!
 */
export async function deriveSharedSecret(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: theirPublicKey
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypt a message using shared secret
 */
export async function encryptMessage(
  message: string,
  sharedKey: CryptoKey
): Promise<EncryptedMessage> {
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    new TextEncoder().encode(message)
  )

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  }
}

/**
 * Decrypt a message using shared secret
 */
export async function decryptMessage(
  encrypted: EncryptedMessage,
  sharedKey: CryptoKey
): Promise<string> {
  const ciphertext = Uint8Array.from(
    atob(encrypted.ciphertext),
    c => c.charCodeAt(0)
  )
  const iv = Uint8Array.from(
    atob(encrypted.iv),
    c => c.charCodeAt(0)
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

