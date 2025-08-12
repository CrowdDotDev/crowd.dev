// Regex to validate a basic email address format.
// Note: This does not cover all valid email formats per RFC 5322.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i