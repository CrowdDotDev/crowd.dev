import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryInsightsProjects } from '@crowd/data-access-layer/src/collections'
import {
  deactivateOctolensKeywordMappingsNotSeen,
  listOctolensKeywordMappings,
  upsertOctolensKeywordMapping,
} from '@crowd/data-access-layer/src/octolens'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { findSegmentById } from '@crowd/data-access-layer/src/segments'

import { createOctolensDeps } from './deps'

vi.mock('@crowd/data-access-layer/src/octolens', () => ({
  listOctolensKeywordMappings: vi.fn(),
  upsertOctolensKeywordMapping: vi.fn(),
  deactivateOctolensKeywordMappingsNotSeen: vi.fn(),
}))
vi.mock('@crowd/data-access-layer/src/collections', () => ({
  InsightsProjectField: { SEGMENT_ID: 'segmentId' },
  queryInsightsProjects: vi.fn(),
}))
vi.mock('@crowd/data-access-layer/src/segments', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/data-access-layer/src/segments')>()),
  findSegmentById: vi.fn(),
}))

const mockedListMappings = vi.mocked(listOctolensKeywordMappings)
const mockedQueryProjects = vi.mocked(queryInsightsProjects)
const mockedFindSegment = vi.mocked(findSegmentById)
const qx = {} as QueryExecutor

type Segment = NonNullable<Awaited<ReturnType<typeof findSegmentById>>>

beforeEach(() => {
  vi.clearAllMocks()
  mockedListMappings.mockResolvedValue([
    { integrationId: 'integration-1', segmentId: 'segment-a', keywordId: 1 },
    { integrationId: 'integration-1', segmentId: 'segment-b', keywordId: 2 },
  ] as Awaited<ReturnType<typeof listOctolensKeywordMappings>>)
})

describe('createOctolensDeps', () => {
  it('resolves keywordIds to segments from the integration mappings', async () => {
    const deps = createOctolensDeps({ qx, integrationId: 'integration-1' })

    expect(await deps.resolveSegmentId(1)).toBe('segment-a')
    expect(await deps.resolveSegmentId(2)).toBe('segment-b')
    expect(await deps.resolveSegmentId(3)).toBeNull()
    expect(mockedListMappings).toHaveBeenCalledWith(qx, 'integration-1')
  })

  it('loads the mappings once per deps instance, not once per lookup', async () => {
    const deps = createOctolensDeps({ qx, integrationId: 'integration-1' })

    await deps.resolveSegmentId(1)
    await deps.resolveSegmentId(2)
    await deps.resolveSegmentId(1)

    expect(mockedListMappings).toHaveBeenCalledTimes(1)
  })

  it('reloads for a new deps instance, so each sync run sees fresh mappings', async () => {
    await createOctolensDeps({ qx, integrationId: 'integration-1' }).resolveSegmentId(1)
    await createOctolensDeps({ qx, integrationId: 'integration-1' }).resolveSegmentId(1)

    expect(mockedListMappings).toHaveBeenCalledTimes(2)
  })

  describe('resolveProjectSegmentId', () => {
    const deps = () => createOctolensDeps({ qx, integrationId: 'integration-1' })

    it('returns the insights project segment when it is a subproject', async () => {
      mockedQueryProjects.mockResolvedValue([{ segmentId: 'segment-sub' }] as never)
      mockedFindSegment.mockResolvedValue({
        id: 'segment-sub',
        slug: 'ebpf',
        parentSlug: 'ebpf-parent',
        grandparentSlug: 'lf',
      } as Segment)

      expect(await deps().resolveProjectSegmentId('ebpf')).toBe('segment-sub')
      expect(mockedQueryProjects).toHaveBeenCalledWith(
        qx,
        expect.objectContaining({ filter: { slug: { eq: 'ebpf' } } }),
      )
    })

    it('returns null when the segment is not a subproject', async () => {
      mockedQueryProjects.mockResolvedValue([{ segmentId: 'segment-group' }] as never)
      mockedFindSegment.mockResolvedValue({
        id: 'segment-group',
        slug: 'lf',
        parentSlug: null,
        grandparentSlug: null,
      } as Segment)

      expect(await deps().resolveProjectSegmentId('lf')).toBeNull()
    })

    it('returns null when no insights project has the slug', async () => {
      mockedQueryProjects.mockResolvedValue([])

      expect(await deps().resolveProjectSegmentId('missing')).toBeNull()
      expect(mockedFindSegment).not.toHaveBeenCalled()
    })
  })

  it('writes and deactivates mappings for its own integration', async () => {
    vi.mocked(deactivateOctolensKeywordMappingsNotSeen).mockResolvedValue(2)
    const deps = createOctolensDeps({ qx, integrationId: 'integration-1' })

    await deps.upsertMapping({ keywordId: 1, keyword: 'ebpf', segmentId: 'segment-a' })
    const deactivated = await deps.deactivateMappingsNotSeen([1])

    expect(upsertOctolensKeywordMapping).toHaveBeenCalledWith(qx, {
      integrationId: 'integration-1',
      keywordId: 1,
      keyword: 'ebpf',
      segmentId: 'segment-a',
    })
    expect(deactivateOctolensKeywordMappingsNotSeen).toHaveBeenCalledWith(qx, 'integration-1', [1])
    expect(deactivated).toBe(2)
  })
})
