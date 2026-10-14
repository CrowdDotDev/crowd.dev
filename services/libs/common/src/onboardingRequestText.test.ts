import { describe, expect, it } from 'vitest'

import { MAX_REQUEST_TEXT_LENGTH, truncateRequestText } from './onboardingRequestText'

describe('truncateRequestText', () => {
  it('keeps short text as is', () => {
    expect(truncateRequestText('onboard https://github.com/acme/one')).toBe(
      'onboard https://github.com/acme/one',
    )
  })

  it('drops the token cut by the limit instead of leaving a shortened URL behind', () => {
    const filler = 'x'.repeat(MAX_REQUEST_TEXT_LENGTH - 20)
    const text = `${filler} https://github.com/acme/partialrepository`

    expect(truncateRequestText(text)).toBe(filler)
  })

  it('falls back to a hard cut when the text has no whitespace', () => {
    expect(truncateRequestText('y'.repeat(MAX_REQUEST_TEXT_LENGTH + 5))).toHaveLength(
      MAX_REQUEST_TEXT_LENGTH,
    )
  })
})
