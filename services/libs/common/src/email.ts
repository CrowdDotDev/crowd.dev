/**
 * Checks if a given string matches a basic email address pattern.
 *
 * @note This only validates the general structure of an email address
 *       and does not fully comply with all valid formats per RFC 5322.
 *       Includes length limits to prevent ReDoS attacks.
 *
 * @param value - The string to test against the email pattern.
 * @returns True if the string matches a basic email format, otherwise false.
 */
export const matchesEmailPattern = (value: string): boolean => {
  // Check length first to prevent ReDoS attacks
  if (value.length > 254) return false // RFC 5321 limit
  
  // Use a safer regex with length constraints
  return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/i.test(value)
}
