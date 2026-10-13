import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listOctolensKeywordMappings } from '@crowd/data-access-layer/src/octolens'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { createOctolensDeps } from './deps'

vi.mock('@crowd/data-access-layer/src/octolens', () => ({
  listOctolensKeywordMappings: vi.fn(),
}))

const mockedListMappings = vi.mocked(listOctolensKeywordMappings)
const qx = {} as QueryExecutor

beforeEach(() => {
  mockedListMappings.mockReset()
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
})
