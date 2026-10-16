import { describe, expect, it } from 'vitest'

import { MemberIdentityType, PlatformType } from '@crowd/types'

import { mapMentionToActivity, octolensActivitySchema, toIsoTimestamp } from './mapper'
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
  authorFollowers: 1200,
  relevance: 'relevant',
  relevanceComment: 'mentions the project by name',
  sentiment: 'Positive',
  language: 'english',
  tags: ['user_feedback'],
  keywords: [{ id: 42, keyword: 'crowd.dev', keywordTag: 'own_brand' }],
  engaged: false,
  isReply: true,
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

  it.each([
    ['reddit', PlatformType.REDDIT],
    ['reddit_comment', PlatformType.REDDIT],
    ['dev', PlatformType.DEVTO],
    ['hackernews', PlatformType.HACKERNEWS],
    ['stackoverflow', PlatformType.STACKOVERFLOW],
    ['medium', PlatformType.MEDIUM],
    ['producthunt', PlatformType.PRODUCTHUNT],
    ['facebook', PlatformType.FACEBOOK],
    ['bluesky', PlatformType.BLUESKY],
    ['tiktok', PlatformType.TIKTOK],
    ['instagram', PlatformType.INSTAGRAM],
  ])('maps person-handle source %s to %s with the author as identity', (source, platform) => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, source })

    expect(mapped?.platform).toBe(platform)
    expect(mapped?.activity.platform).toBe(platform)
    expect(mapped?.activity.member.identities).toEqual([
      { platform, value: 'octocat', type: MemberIdentityType.USERNAME, verified: true },
    ])
  })

  it.each(['podcasts', 'news', 'firehose', 'newsletter', 'trustpilot', 'unknown'])(
    'skips non-person source %s',
    (source) => {
      expect(mapMentionToActivity({ ...BASE_MENTION, source })).toBeNull()
    },
  )

  it('uses the channel id from authorUrl as the youtube identity', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      source: 'youtube',
      author: 'Some Creator',
      authorUrl: 'https://www.youtube.com/channel/UCabc123XYZ',
    })

    expect(mapped?.platform).toBe(PlatformType.YOUTUBE)
    expect(mapped?.activity.member.identities).toEqual([
      {
        platform: PlatformType.YOUTUBE,
        value: 'UCabc123XYZ',
        type: MemberIdentityType.USERNAME,
        verified: true,
      },
    ])
    expect(mapped?.activity.member.attributes).toMatchObject({
      url: { [PlatformType.YOUTUBE]: 'https://www.youtube.com/channel/UCabc123XYZ' },
    })
  })

  it.each([
    'https://www.youtube.com/@somecreator',
    'https://www.youtube.com/channel/',
    'https://example.com/channel/UCabc',
    'not a url',
    null,
  ])('skips a youtube mention whose authorUrl %s has no channel id', (authorUrl) => {
    expect(mapMentionToActivity({ ...BASE_MENTION, source: 'youtube', authorUrl })).toBeNull()
  })

  it('maps a youtube mention with a channel id even when author is missing', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      source: 'youtube',
      author: null,
      authorName: null,
      authorUrl: 'https://www.youtube.com/channel/UCabc123XYZ',
    })

    expect(mapped?.activity.member.identities[0].value).toBe('UCabc123XYZ')
    expect(mapped?.activity.member.displayName).toBe('UCabc123XYZ')
  })

  it('falls back to the author handle when authorName is an empty string', () => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, authorName: '' })

    expect(mapped?.activity.member.displayName).toBe('octocat')
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

  it('captures every documented Mention field without a dedicated column in activity.attributes', () => {
    const review = {
      rating: 4,
      ratingMax: 5,
      verified: true,
      response: null,
      responseAt: null,
      targetName: 'crowd.dev',
    }
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      relevanceScore: 0,
      feedbackRelevant: 1,
      imageUrl: 'https://example.com/preview.png',
      engagementMetrics: { likes: 10, replies: 2 },
      engagementObservedAt: '2026-10-12 09:00:00.000',
      review,
    })

    expect(mapped?.activity.attributes).toEqual({
      octolensMentionId: 1,
      authorFollowers: 1200,
      relevance: 'relevant',
      relevanceScore: 0,
      relevanceComment: 'mentions the project by name',
      sentiment: 'Positive',
      language: 'english',
      tags: ['user_feedback'],
      keywords: [{ id: 42, keyword: 'crowd.dev', keywordTag: 'own_brand' }],
      keywordId: 42,
      engaged: false,
      isReply: true,
      feedbackRelevant: 1,
      imageUrl: 'https://example.com/preview.png',
      engagementMetrics: { likes: 10, replies: 2 },
      engagementObservedAt: '2026-10-12 09:00:00.000',
      review: { rating: 4, ratingMax: 5, verified: true, targetName: 'crowd.dev' },
    })
  })

  it('omits null and absent optional fields instead of writing them as null', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      authorFollowers: null,
      relevanceComment: null,
      sentiment: null,
      language: null,
      relevanceScore: null,
    })

    const attributes = mapped?.activity.attributes ?? {}
    for (const key of [
      'authorFollowers',
      'relevanceComment',
      'sentiment',
      'language',
      'relevanceScore',
      'review',
      'engagementMetrics',
      'imageUrl',
    ]) {
      expect(attributes).not.toHaveProperty(key)
    }
  })

  it('keeps false booleans and empty arrays in activity.attributes', () => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, engaged: false, tags: [] })

    expect(mapped?.activity.attributes).toMatchObject({ engaged: false, tags: [] })
  })

  it('keeps authorFollowers on the activity only, never on member.reach', () => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'linkedin' })

    expect(mapped?.activity.attributes).toMatchObject({ authorFollowers: 1200 })
    expect(mapped?.activity.member).not.toHaveProperty('reach')
  })

  describe('channel', () => {
    it.each([
      [
        'https://github.com/CrowdDotDev/Crowd.dev/issues/12',
        'https://github.com/CrowdDotDev/Crowd.dev',
      ],
      ['https://github.com/CrowdDotDev/crowd.dev', 'https://github.com/CrowdDotDev/crowd.dev'],
      ['https://github.com/CrowdDotDev/crowd.dev/', 'https://github.com/CrowdDotDev/crowd.dev'],
      ['https://github.com/CrowdDotDev/crowd.dev.git', 'https://github.com/CrowdDotDev/crowd.dev'],
      ['https://www.github.com/owner/repo/pull/3#discussion_r1', 'https://github.com/owner/repo'],
    ])('uses the repo URL for github mention %s', (url, channel) => {
      const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'github', url })

      expect(mapped?.activity.channel).toBe(channel)
    })

    it.each([
      'https://github.com/octocat',
      'https://github.com/orgs/CrowdDotDev/discussions/5',
      'https://gist.github.com/octocat/abc123',
      'https://github.com/sponsors/octocat',
      'https://github.com/issues/assigned',
      'https://github.com/stars/octocat/lists/favorites',
      'https://github.com/advisories/GHSA-abcd-1234-efgh',
      'https://github.com/',
      'https://example.com/post',
    ])('falls back to the matched keyword for github url %s with no repo', (url) => {
      const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'github', url })

      expect(mapped?.activity.channel).toBe('crowd.dev')
    })

    it.each([
      ['reddit', 'https://www.reddit.com/r/kubernetes/comments/1abc234/some_title/'],
      ['reddit_comment', 'https://old.reddit.com/r/kubernetes/comments/1abc234/x/kz9/'],
    ])('uses the bare subreddit name for %s', (source, url) => {
      const mapped = mapMentionToActivity({ ...BASE_MENTION, source, url })

      expect(mapped?.activity.channel).toBe('kubernetes')
    })

    it('falls back to the matched keyword for a reddit url with no subreddit', () => {
      const mapped = mapMentionToActivity({
        ...BASE_MENTION,
        source: 'reddit',
        url: 'https://www.reddit.com/user/someone/comments/1abc/x/',
      })

      expect(mapped?.activity.channel).toBe('crowd.dev')
    })

    it('does not read a reddit user named r as a subreddit', () => {
      const mapped = mapMentionToActivity({
        ...BASE_MENTION,
        source: 'reddit',
        url: 'https://www.reddit.com/user/r/comments/1abc/x/',
      })

      expect(mapped?.activity.channel).toBe('crowd.dev')
    })

    it.each(['twitter', 'linkedin', 'dev', 'hackernews', 'stackoverflow', 'bluesky', 'tiktok'])(
      'uses the matched keyword for %s',
      (source) => {
        const mapped = mapMentionToActivity({ ...BASE_MENTION, source })

        expect(mapped?.activity.channel).toBe('crowd.dev')
      },
    )

    it('picks the keyword matching keywordId, not just the first one', () => {
      const mapped = mapMentionToActivity({
        ...BASE_MENTION,
        source: 'twitter',
        keywords: [
          { id: 7, keyword: 'other' },
          { id: 42, keyword: 'crowd.dev' },
        ],
        keywordId: 42,
      })

      expect(mapped?.activity.channel).toBe('crowd.dev')
    })

    it('leaves channel unset when keywordId is not among the keywords', () => {
      const mapped = mapMentionToActivity({
        ...BASE_MENTION,
        source: 'twitter',
        keywords: [{ id: 7, keyword: 'other' }],
        keywordId: 42,
      })

      expect(mapped?.activity.channel).toBeUndefined()
    })

    it('leaves channel unset when no keyword text is available', () => {
      const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'twitter', keywords: [] })

      expect(mapped?.activity.channel).toBeUndefined()
    })

    it('keeps the channel through octolensActivitySchema', () => {
      const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'reddit' })

      expect(octolensActivitySchema.parse(mapped?.activity).channel).toBe('crowd.dev')
    })
  })

  it('keeps the new attributes through octolensActivitySchema instead of stripping them', () => {
    const mapped = mapMentionToActivity(BASE_MENTION)

    const parsed = octolensActivitySchema.parse(mapped?.activity)

    expect(parsed.attributes).toMatchObject({ octolensMentionId: 1, sentiment: 'Positive' })
  })
})

describe('toIsoTimestamp', () => {
  it('converts the documented format to ISO8601 UTC', () => {
    expect(toIsoTimestamp('2026-10-12 08:30:00.000')).toBe('2026-10-12T08:30:00.000Z')
  })

  it('rejects a string that does not match the documented format', () => {
    expect(() => toIsoTimestamp('not-a-timestamp')).toThrow()
  })

  it('rejects an invalid calendar date instead of letting Date silently normalize it', () => {
    // Date would otherwise roll 2026-02-30 forward to 2026-03-02, moving the watermark
    // past valid mentions in between and permanently skipping them.
    expect(() => toIsoTimestamp('2026-02-30 08:00:00.000')).toThrow()
  })

  it('rejects an out-of-range time component instead of letting Date roll it over', () => {
    expect(() => toIsoTimestamp('2026-10-12 24:00:00.000')).toThrow()
  })
})
