/**
 * Checks if a given string matches a basic email address pattern.
 *
 * @note This only validates the general structure of an email address
 *       and does not fully comply with all valid formats per RFC 5322.
 *
 * @param value - The string to test against the email pattern.
 * @returns True if the string matches a basic email format, otherwise false.
 */
export const matchesEmailPattern = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)
