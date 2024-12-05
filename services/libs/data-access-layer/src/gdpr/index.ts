import crypto from 'crypto'

/**
 * Creates a deterministic anonymized username from the original username, platform and type
 * @param username The original username to anonymize
 * @param platform The platform the username belongs to
 * @param type The type of identity (e.g. 'username', 'email')
 * @returns A consistently hashed anonymous identity in the format 'anon_<type>_<hash>'
 */
export function anonymizeUsername(username: string, platform: string, type: string): string {
  // hash using SHA-256 for strong one-way hashing
  const hash = crypto
    .createHash('sha256')
    // all inputs to lowercase and combine them for hashing
    .update(`${username.toLowerCase()}-${platform.toLowerCase()}-${type.toLowerCase()}`)
    // Get first 8 characters of the hex hash for brevity
    .digest('hex')
    .slice(0, 8)

  // anonymized username in a consistent format
  return `anon_user_${hash}`
}
