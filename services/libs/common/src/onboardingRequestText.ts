export const MAX_REQUEST_TEXT_LENGTH = 10_000

const WHITESPACE = /\s/

export function truncateRequestText(text: string): string {
  if (text.length <= MAX_REQUEST_TEXT_LENGTH) {
    return text
  }
  const hardCut = text.slice(0, MAX_REQUEST_TEXT_LENGTH)
  if (WHITESPACE.test(text[MAX_REQUEST_TEXT_LENGTH])) {
    return hardCut.trimEnd()
  }
  const atWordBoundary = hardCut.replace(/\S+$/, '').trimEnd()
  return atWordBoundary || hardCut
}
