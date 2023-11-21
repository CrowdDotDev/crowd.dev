import { webcrypto as crypto } from 'node:crypto'

const CIPHER = 'AES-GCM'
const IV_LENGTH_BYTES = 12
const TAG_LENGTH_BYTES = 16

export async function encrypt(data: Uint8Array, key: crypto.CryptoKey): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES))
  const encrypted = await crypto.subtle.encrypt(
    {
      name: CIPHER,
      iv,
      tagLength: TAG_LENGTH_BYTES * 8,
    },
    key,
    data,
  )

  return Buffer.concat([iv, new Uint8Array(encrypted)])
}

export async function decrypt(
  encryptedData: Uint8Array,
  key: crypto.CryptoKey,
): Promise<Uint8Array> {
  const iv = encryptedData.subarray(0, IV_LENGTH_BYTES)
  const ciphertext = encryptedData.subarray(IV_LENGTH_BYTES)
  const decrypted = await crypto.subtle.decrypt(
    {
      name: CIPHER,
      iv,
      tagLength: TAG_LENGTH_BYTES * 8,
    },
    key,
    ciphertext,
  )

  return new Uint8Array(decrypted)
}
