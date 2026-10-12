export const MAX_REQUEST_TEXT_LENGTH = 10_000

export function truncateRequestText(text: string): string {
  return text.length > MAX_REQUEST_TEXT_LENGTH ? text.slice(0, MAX_REQUEST_TEXT_LENGTH) : text
}
