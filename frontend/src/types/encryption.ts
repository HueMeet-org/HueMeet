export interface KeyPair {
  privateKey: CryptoKey
  publicKey: CryptoKey
}

export interface ExportedKeys {
  privateKey: string  // base64
  publicKey: string   // base64
}

export interface EncryptedMessage {
  ciphertext: string  // base64
  iv: string          // base64
}