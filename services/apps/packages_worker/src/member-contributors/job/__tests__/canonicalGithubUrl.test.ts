import { describe, expect, it } from 'vitest'

import { canonicalGithubUrl } from '../canonicalGithubUrl'

describe('canonicalGithubUrl', () => {
  it.each([
    ['https://github.com/haskell/aeson', 'https://github.com/haskell/aeson'],
    ['https://github.com/Haskell/Aeson.git', 'https://github.com/haskell/aeson'],
    ['http://www.github.com/haskell/aeson/', 'https://github.com/haskell/aeson'],
    ['https://github.com/haskell/aeson/tree/main/src', 'https://github.com/haskell/aeson'],
    ['github.com/haskell/aeson', 'https://github.com/haskell/aeson'],
  ])('canonicalises %s', (raw, url) => {
    expect(canonicalGithubUrl(raw)).toEqual({
      kind: 'github',
      url,
      owner: 'haskell',
      name: 'aeson',
    })
  })

  it('reports other hosts', () => {
    expect(canonicalGithubUrl('https://gitlab.com/a/b')).toEqual({
      kind: 'other',
      host: 'gitlab.com',
    })
  })

  it.each(['https://github.com/haskell', 'not a url', 'https://github.com/'])(
    'rejects %s',
    (raw) => {
      expect(canonicalGithubUrl(raw)).toEqual({ kind: 'invalid' })
    },
  )
})
