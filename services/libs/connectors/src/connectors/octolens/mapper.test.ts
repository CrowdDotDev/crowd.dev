import { describe, expect, it } from 'vitest'

import { MemberIdentityType, PlatformType } from '@crowd/types'

import {
  mapMentionToActivity,
  octolensActivitySchema,
  profileLinkIdentity,
  toIsoTimestamp,
} from './mapper'
import type { OctolensMention } from './mentionsClient'

const BASE_MENTION: OctolensMention = {
  id: 200162933,
  sourceId: 'IC_kwDOA1b2c3',
  url: 'https://github.com/CrowdDotDev/crowd.dev/issues/12#issuecomment-1',
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
  it('maps a github mention to a verified identity taken from the profile link', () => {
    const mapped = mapMentionToActivity(BASE_MENTION)

    expect(mapped?.platform).toBe(PlatformType.GITHUB)
    expect(mapped?.activity).toMatchObject({
      type: 'mention',
      platform: PlatformType.GITHUB,
      sourceId: '200162933',
      score: 0,
      channel: 'github',
      title: 'Something about crowd.dev',
      body: 'post body',
      url: 'https://github.com/CrowdDotDev/crowd.dev/issues/12#issuecomment-1',
      timestamp: '2026-10-12T08:30:00.000Z',
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

  it('takes the linkedin handle from the profile link, not the display name in author', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      source: 'linkedin',
      author: 'Daniel Kornaś',
      authorName: 'Daniel Kornaś',
      authorUrl: 'https://www.linkedin.com/in/daniel-kornas',
    })

    expect(mapped?.platform).toBe(PlatformType.LINKEDIN)
    expect(mapped?.activity.member.identities[0].value).toBe('daniel-kornas')
    expect(mapped?.activity.member.displayName).toBe('Daniel Kornaś')
    expect(mapped?.activity.channel).toBe('linkedin')
  })

  it.each(['https://twitter.com/DanKornas', 'https://x.com/DanKornas'])(
    'takes the twitter handle from %s',
    (authorUrl) => {
      const mapped = mapMentionToActivity({ ...BASE_MENTION, source: 'twitter', authorUrl })

      expect(mapped?.platform).toBe(PlatformType.TWITTER)
      expect(mapped?.activity.member.identities[0].value).toBe('DanKornas')
    },
  )

  it.each([
    ['a github app (bot)', 'https://github.com/apps/github-actions'],
    ['a linkedin company page', 'https://www.linkedin.com/company/crowd-dev'],
    ['a profile link with no handle', 'https://github.com/'],
  ])('skips %s', (_name, authorUrl) => {
    expect(mapMentionToActivity({ ...BASE_MENTION, authorUrl })).toBeNull()
  })

  it.each([
    ['reddit', 'https://github.com/octocat'],
    ['podcasts', 'https://twitter.com/someshow'],
    ['github', 'https://x.com/octocat'],
  ])(
    'skips a %s mention whose profile link points at another platform (%s)',
    (source, authorUrl) => {
      expect(mapMentionToActivity({ ...BASE_MENTION, source, authorUrl })).toBeNull()
    },
  )

  it.each([undefined, null, ''])('skips a mention without an Octolens id (%s)', (id) => {
    expect(
      mapMentionToActivity({ ...BASE_MENTION, id } as unknown as typeof BASE_MENTION),
    ).toBeNull()
  })

  it.each(['github', 'twitter', 'linkedin'])(
    'skips a %s mention without a profile link instead of trusting author',
    (source) => {
      expect(mapMentionToActivity({ ...BASE_MENTION, source, authorUrl: null })).toBeNull()
    },
  )

  it.each([
    ['reddit', 'https://www.reddit.com/user/someone'],
    ['bluesky', 'https://bsky.app/profile/someone.bsky.social'],
    ['dev', 'https://dev.to/someone'],
    ['youtube', 'https://www.youtube.com/channel/UCM3dtS2CXWAffSTda-B6YBA'],
    ['instagram', 'https://www.instagram.com/someone/'],
    ['podcasts', 'https://www.spreaker.com/show/alacarta'],
    ['news', null],
  ])('does not emit %s mentions yet', (source, authorUrl) => {
    expect(mapMentionToActivity({ ...BASE_MENTION, source, authorUrl })).toBeNull()
  })

  it('keeps the octolens fields and the mention context in activity.attributes', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      relevanceScore: 0,
      feedbackRelevant: 1,
      engagementMetrics: { likes: 10, replies: 2 },
    })

    expect(mapped?.activity.attributes).toEqual({
      octolensMentionId: 200162933,
      octolensSource: 'github',
      postId: 'IC_kwDOA1b2c3',
      keyword: 'crowd.dev',
      keywordId: 42,
      repoUrl: 'https://github.com/CrowdDotDev/crowd.dev',
      authorFollowers: 1200,
      relevance: 'relevant',
      relevanceScore: 0,
      relevanceComment: 'mentions the project by name',
      sentiment: 'Positive',
      language: 'english',
      tags: ['user_feedback'],
      keywords: [{ id: 42, keyword: 'crowd.dev', keywordTag: 'own_brand' }],
      engaged: false,
      isReply: true,
      feedbackRelevant: 1,
      engagementMetrics: { likes: 10, replies: 2 },
    })
  })

  it('records the keyword chosen by keywordId when the mention lists several', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      keywords: [
        { id: 7, keyword: 'other' },
        { id: 42, keyword: 'crowd.dev' },
      ],
      keywordId: 42,
    })

    expect(mapped?.activity.attributes).toMatchObject({ keyword: 'crowd.dev', keywordId: 42 })
  })

  it.each([
    ['https://github.com/octocat', undefined],
    ['https://github.com/orgs/CrowdDotDev/discussions/5', undefined],
    ['https://example.com/post', undefined],
    ['https://www.github.com/owner/repo.git', 'https://github.com/owner/repo'],
  ])('sets repoUrl for github url %s only when it names a repo', (url, repoUrl) => {
    const mapped = mapMentionToActivity({ ...BASE_MENTION, url })

    expect(mapped?.activity.attributes?.repoUrl).toBe(repoUrl)
  })

  it('omits null optional fields instead of writing them as null', () => {
    const mapped = mapMentionToActivity({
      ...BASE_MENTION,
      authorFollowers: null,
      relevanceComment: null,
      sentiment: null,
      language: null,
    })

    const attributes = mapped?.activity.attributes ?? {}
    for (const key of ['authorFollowers', 'relevanceComment', 'sentiment', 'language', 'review']) {
      expect(attributes).not.toHaveProperty(key)
    }
  })

  it('falls back to author, then the handle, for the display name', () => {
    expect(
      mapMentionToActivity({ ...BASE_MENTION, authorName: null })?.activity.member.displayName,
    ).toBe('octocat')
    expect(
      mapMentionToActivity({ ...BASE_MENTION, authorName: '', author: '' })?.activity.member
        .displayName,
    ).toBe('octocat')
  })

  it('passes through octolensActivitySchema unchanged', () => {
    const mapped = mapMentionToActivity(BASE_MENTION)

    expect(octolensActivitySchema.parse(mapped?.activity)).toEqual(mapped?.activity)
  })
})

describe('profileLinkIdentity', () => {
  it.each([
    ['https://github.com/octocat', { platform: PlatformType.GITHUB, value: 'octocat' }],
    ['https://x.com/someone', { platform: PlatformType.TWITTER, value: 'someone' }],
    ['https://uk.linkedin.com/in/someone', { platform: PlatformType.LINKEDIN, value: 'someone' }],
    ['https://github.com/apps/dependabot', null],
    ['https://mobile.twitter.com/someone', { platform: PlatformType.TWITTER, value: 'someone' }],
    ['https://x.com/i/user/123', null],
    ['https://x.com/compose/post', null],
    ['https://twitter.com/login', null],
    ['https://x.com/signup', null],
    ['https://github.com/user-', null],
    ['https://github.com/user--name', null],
    ['https://github.com/user-name', { platform: PlatformType.GITHUB, value: 'user-name' }],
    ['https://twitter.com/intent/user?screen_name=foo', null],
    ['https://twitter.com/hashtag/kubernetes', null],
    [
      'https://www.linkedin.com/in/j%C3%B6rg-x/',
      { platform: PlatformType.LINKEDIN, value: 'jörg-x' },
    ],
    ['https://www.reddit.com/user/someone', undefined],
    [null, undefined],
  ])('reads %s', (link, expected) => {
    expect(profileLinkIdentity(link)).toEqual(expected)
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
