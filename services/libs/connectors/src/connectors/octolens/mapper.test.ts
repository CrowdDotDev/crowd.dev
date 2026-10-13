import { describe, expect, it } from 'vitest'

import { MemberIdentityType, PlatformType } from '@crowd/types'

import { mapMentionToActivity } from './mapper'
import type { OctolensMention } from './mentionsClient'

const BASE_MENTION: OctolensMention = {
  id: 1,
  sourceId: 'reddit_t3_1abc234',
  url: 'https://example.com/post',
  title: 'Something about crowd.dev',
  body: 'post body',
  source: 'github',
  timestamp: '2026-10-12 08:30:00.000',
  author: 'octocat',
  authorName: 'The Octocat',
  authorUrl: 'https://github.com/octocat',
  authorAvatar: 'https://github.com/octocat.png',
  keywordId: 42,
}

describe('mapMentionToActivity', () => {
  it('maps a supported source to the matching platform and a verified member identity', () => {
    const mapped = mapMentionToActivity(BASE_MENTION)

    expect(mapped?.platform).toBe(PlatformType.GITHUB)
    expect(mapped?.keywordId).toBe(42)
    expect(mapped?.activity).toMatchObject({
      type: 'mention',
      platform: PlatformType.GITHUB,
      sourceId: 'reddit_t3_1abc234',
      score: 6,
      title: 'Something about crowd.dev',
      body: 'post body',
      url: 'https://example.com/post',
      member: {
        displayName: 'The Octocat',
        identities: [
          {
            platform: PlatformType.GITHUB,
            value: 'octocat',
            type: MemberIdentityType.USERNAME,
            verified: true,
          },
        ],
        attributes: {
          url: { [PlatformType.GITHUB]: 'https://github.com/octocat' },
          avatarUrl: { [PlatformType.GITHUB]: 'https://github.com/octocat.png' },
        },
      },
    })
  })

  it('matches source case-insensitively (historical rows can be uppercase)', () => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'GITHUB' })

    expect(mapped?.platform).toBe(PlatformType.GITHUB)
  })

  it.each(['twitter', 'linkedin'])('maps %s to its platform too', (source) => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, source })

    expect(mapped?.platform).toBe(source)
  })

  it('skips an unsupported source', () => {
    expect(mapMentionToActivity({ ...BASE_MENTION, source: 'reddit' })).toBeNull()
  })

  it('skips a mention with no author identity', () => {
    expect(mapMentionToActivity({ ...BASE_MENTION, author: null })).toBeNull()
  })

  it('falls back to the author handle when authorName is missing', () => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, authorName: null })

    expect(mapped?.activity.member.displayName).toBe('octocat')
  })

  it('omits attributes when authorUrl and authorAvatar are both missing', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      authorUrl: null,
      authorAvatar: null,
    })

    expect(mapped?.activity.member.attributes).toBeUndefined()
  })

  it('converts the UTC-no-suffix timestamp to a proper ISO string', () => {
    const mapped = mapMentionToActivity(BASE_MENTION)

    expect(mapped?.activity.timestamp).toBe('2026-10-12T08:30:00.000Z')
  })

  it('passes through an absent keywordId as undefined rather than assuming it is set', () => {
    const { keywordId, ...withoutKeywordId } = BASE_MENTION
    void keywordId

    const mapped = mapMentionToActivity(withoutKeywordId as OctolensMention)

    expect(mapped?.keywordId).toBeUndefined()
  })
})
