import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Logger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'

import type { Credential, SyncContext } from '../../../types'
import type { OctolensDeps } from '../deps'
import { fetchMentionsPage } from '../mentionsClient'
import type { OctolensMention, OctolensMentionsPage } from '../mentionsClient'
import { runMentionPoll } from './mentionPoll'

vi.mock('../mentionsClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../mentionsClient')>()
  return { ...actual, fetchMentionsPage: vi.fn() }
})

const mockedFetchMentionsPage = vi.mocked(fetchMentionsPage)

type OctolensSyncContext = SyncContext<OctolensDeps>

const OCTOLENS_CREDENTIAL: Credential = {
  platform: 'octolens',
  kind: 'octolens-token',
  data: { token: 'test-token' },
}

const LOG = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger

function mention(overrides: Partial<OctolensMention> = {}): OctolensMention {
  return {
    id: 1,
    sourceId: 'src-1',
    url: 'https://example.com',
    title: null,
    body: null,
    source: 'github',
    timestamp: '2026-10-12 08:00:00.000',
    author: 'octocat',
    authorName: 'The Octocat',
    authorUrl: null,
    authorAvatar: null,
    authorFollowers: null,
    relevance: 'relevant',
    relevanceComment: null,
    sentiment: null,
    language: null,
    tags: [],
    keywords: [],
    engaged: false,
    isReply: false,
    keywordId: 1,
    ...overrides,
  }
}

function page(data: OctolensMention[], nextCursor: string | null = null): OctolensMentionsPage {
  return { data, nextCursor }
}

function makeCtx(
  overrides: Partial<Omit<OctolensSyncContext, 'deps'>> & Partial<OctolensDeps> = {},
): {
  ctx: OctolensSyncContext
  emitted: { records: unknown[]; segmentId?: string; integrationId?: string }[]
  watermarks: Record<string, unknown>[]
} {
  const emitted: { records: unknown[]; segmentId?: string; integrationId?: string }[] = []
  const watermarks: Record<string, unknown>[] = []

  const { resolveSegmentId, ...ctxOverrides } = overrides
  const ctx: OctolensSyncContext = {
    channel: { channelId: 'octolens-global', channelName: 'octolens-global' },
    integrationId: 'integration-1',
    watermark: null,
    emit: async (records, emitOverrides) => {
      emitted.push({
        records,
        segmentId: emitOverrides?.segmentId,
        integrationId: emitOverrides?.integrationId,
      })
    },
    commitWatermark: async (watermark) => {
      watermarks.push(watermark)
    },
    hasRunBudget: () => true,
    http: {} as OctolensSyncContext['http'],
    log: LOG,
    getCredential: async () => OCTOLENS_CREDENTIAL,
    deps: {
      resolveSegmentId: resolveSegmentId ?? (async (keywordId) => `segment-${keywordId}`),
      resolveProjectSegmentId: async () => null,
      upsertMapping: async () => undefined,
      deactivateMappingsNotSeen: async () => 0,
    },
    ...ctxOverrides,
  }

  return { ctx, emitted, watermarks }
}

beforeEach(() => {
  mockedFetchMentionsPage.mockReset()
})

describe('runMentionPoll', () => {
  it('emits mapped mentions grouped by resolved segment and commits the watermark', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([mention({ keywordId: 1 }), mention({ keywordId: 2, sourceId: 'src-2' })]),
    )
    const { ctx, emitted, watermarks } = makeCtx()

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(2)
    expect(emitted.map((e) => e.segmentId).sort()).toEqual(['segment-1', 'segment-2'])
    expect(emitted.every((e) => e.integrationId === 'integration-1')).toBe(true)
    expect(watermarks).toEqual([
      { startDate: '2026-10-12T08:00:00.000Z', cursor: null, pendingMaxTimestamp: null },
    ])
  })

  it('groups multiple mentions mapping to the same segment into one emit call', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([mention({ keywordId: 1 }), mention({ keywordId: 1, sourceId: 'src-2' })]),
    )
    const { ctx, emitted } = makeCtx()

    await runMentionPoll(ctx)

    expect(emitted).toHaveLength(1)
    expect(emitted[0].records).toHaveLength(2)
  })

  it('skips a mention with an unparseable timestamp instead of throwing', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([
        mention({ timestamp: 'not-a-timestamp', sourceId: 'bad' }),
        mention({ sourceId: 'ok' }),
      ]),
    )
    const { ctx, emitted, watermarks } = makeCtx()

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(1)
    expect((emitted[0].records[0] as { sourceId: string }).sourceId).toBe('ok')
    expect(watermarks).toEqual([
      { startDate: '2026-10-12T08:00:00.000Z', cursor: null, pendingMaxTimestamp: null },
    ])
  })

  it('skips an unsupported source without throwing or emitting it', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention({ source: 'reddit' })]))
    const { ctx, emitted } = makeCtx()

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(0)
  })

  it('skips a mention whose keywordId has no mapping', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention()]))
    const { ctx, emitted } = makeCtx({ resolveSegmentId: async () => null })

    await runMentionPoll(ctx)

    expect(emitted).toHaveLength(0)
  })

  it('skips a mention with no keywordId without calling resolveSegmentId', async () => {
    const { keywordId, ...withoutKeywordId } = mention()
    void keywordId
    mockedFetchMentionsPage.mockResolvedValue(page([withoutKeywordId as OctolensMention]))
    const resolveSegmentId = vi.fn(async () => 'segment-1')
    const { ctx, emitted } = makeCtx({ resolveSegmentId })

    await runMentionPoll(ctx)

    expect(emitted).toHaveLength(0)
    expect(resolveSegmentId).not.toHaveBeenCalled()
  })

  it('skips a mention that fails to map (e.g. a malformed field) instead of crashing the page', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([
        { ...mention({ sourceId: 'bad' }), source: undefined } as unknown as OctolensMention,
        mention({ sourceId: 'ok' }),
      ]),
    )
    const { ctx, emitted } = makeCtx()

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(1)
    expect((emitted[0].records[0] as { sourceId: string }).sourceId).toBe('ok')
  })

  it('still advances the watermark past a mention whose timestamp parsed but mapping failed', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([
        {
          ...mention({ timestamp: '2026-10-12 09:00:00.000' }),
          source: undefined,
        } as unknown as OctolensMention,
      ]),
    )
    const { ctx, watermarks } = makeCtx()

    await runMentionPoll(ctx)

    expect(watermarks).toEqual([
      { startDate: '2026-10-12T09:00:00.000Z', cursor: null, pendingMaxTimestamp: null },
    ])
  })

  it('skips a mention whose mapped activity fails schema validation instead of emitting it', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([
        { ...mention({ sourceId: 'bad-title' }), title: 123 } as unknown as OctolensMention,
        mention({ sourceId: 'ok' }),
      ]),
    )
    const { ctx, emitted } = makeCtx()

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(1)
    expect((emitted[0].records[0] as { sourceId: string }).sourceId).toBe('ok')
  })

  it('skips a null page entry instead of crashing the whole page', async () => {
    mockedFetchMentionsPage.mockResolvedValue(
      page([null as unknown as OctolensMention, mention({ sourceId: 'ok' })]),
    )
    const { ctx, emitted } = makeCtx()

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(1)
    expect((emitted[0].records[0] as { sourceId: string }).sourceId).toBe('ok')
  })

  it('propagates a resolveSegmentId failure instead of swallowing it as a skip', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention()]))
    const { ctx, watermarks } = makeCtx({
      resolveSegmentId: async () => {
        throw new Error('db connection lost')
      },
    })

    await expect(runMentionPoll(ctx)).rejects.toThrow('db connection lost')
    // No watermark commit either — a transient failure must not advance past this mention.
    expect(watermarks).toHaveLength(0)
  })

  it('still advances the watermark past a skipped mention', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention({ source: 'reddit' })]))
    const { ctx, watermarks } = makeCtx()

    await runMentionPoll(ctx)

    expect(watermarks).toEqual([
      { startDate: '2026-10-12T08:00:00.000Z', cursor: null, pendingMaxTimestamp: null },
    ])
  })

  it('paginates until nextCursor is null, passing the cursor and the original startDate through', async () => {
    mockedFetchMentionsPage
      .mockResolvedValueOnce(page([mention({ sourceId: 'page-1' })], 'cursor-2'))
      .mockResolvedValueOnce(
        page([mention({ sourceId: 'page-2', timestamp: '2026-10-12 09:00:00.000' })], null),
      )
    const { ctx, emitted, watermarks } = makeCtx({
      watermark: { startDate: '2026-10-01T00:00:00.000Z' },
    })

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: true })
    expect(emitted).toHaveLength(2)
    expect(mockedFetchMentionsPage).toHaveBeenNthCalledWith(1, 'test-token', {
      startDate: '2026-10-01T00:00:00.000Z',
      cursor: undefined,
    })
    expect(mockedFetchMentionsPage).toHaveBeenNthCalledWith(2, 'test-token', {
      startDate: '2026-10-01T00:00:00.000Z',
      cursor: 'cursor-2',
    })
    // Intermediate commit resumes via cursor, not startDate — advancing early risks skipping
    // page 2's unseen mentions if Octolens orders newest-first and the run is cut short here.
    expect(watermarks).toEqual([
      {
        startDate: '2026-10-01T00:00:00.000Z',
        cursor: 'cursor-2',
        pendingMaxTimestamp: '2026-10-12T08:00:00.000Z',
      },
      { startDate: '2026-10-12T09:00:00.000Z', cursor: null, pendingMaxTimestamp: null },
    ])
  })

  it('does not advance startDate when the run budget runs out mid-pagination, only the cursor', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention()], 'cursor-2'))
    let calls = 0
    const { ctx, watermarks } = makeCtx({
      watermark: { startDate: '2026-10-01T00:00:00.000Z' },
      hasRunBudget: () => calls++ === 0,
    })

    const outcome = await runMentionPoll(ctx)

    expect(outcome).toEqual({ complete: false })
    expect(watermarks).toEqual([
      {
        startDate: '2026-10-01T00:00:00.000Z',
        cursor: 'cursor-2',
        pendingMaxTimestamp: '2026-10-12T08:00:00.000Z',
      },
    ])
  })

  it('carries pendingMaxTimestamp across a resumed cycle instead of resetting to startDate', async () => {
    mockedFetchMentionsPage.mockResolvedValueOnce(
      page([mention({ sourceId: 'resume', timestamp: '2026-10-05 00:00:00.000' })], null),
    )
    const { ctx, watermarks } = makeCtx({
      watermark: {
        startDate: '2026-10-01T00:00:00.000Z',
        cursor: 'cursor-2',
        pendingMaxTimestamp: '2026-10-12T08:00:00.000Z',
      },
    })

    await runMentionPoll(ctx)

    // Drains on a page whose own timestamp is older than the earlier run's max — the
    // committed startDate must still be the carried-forward max, not this page's lower value.
    expect(watermarks).toEqual([
      {
        startDate: '2026-10-12T08:00:00.000Z',
        cursor: null,
        pendingMaxTimestamp: null,
      },
    ])
  })

  it('resumes from a persisted cursor on the next run without redoing startDate', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention()], null))
    const { ctx } = makeCtx({
      watermark: { startDate: '2026-10-01T00:00:00.000Z', cursor: 'cursor-2' },
    })

    await runMentionPoll(ctx)

    expect(mockedFetchMentionsPage).toHaveBeenCalledWith('test-token', {
      startDate: '2026-10-01T00:00:00.000Z',
      cursor: 'cursor-2',
    })
  })

  it('rejects a credential of the wrong kind', async () => {
    const { ctx } = makeCtx({
      getCredential: async () => ({
        platform: 'github',
        kind: 'github-app',
        data: { appId: 'a', privateKey: 'k' },
      }),
    })

    await expect(runMentionPoll(ctx)).rejects.toThrow(
      'expected octolens-token credential, got github-app',
    )
  })

  it('maps a GitHub-sourced mention to PlatformType.GITHUB end to end', async () => {
    mockedFetchMentionsPage.mockResolvedValue(page([mention()]))
    const { ctx, emitted } = makeCtx()

    await runMentionPoll(ctx)

    const [record] = emitted[0].records as { platform: string }[]
    expect(record.platform).toBe(PlatformType.GITHUB)
  })
})
