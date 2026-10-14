import { beforeEach, describe, expect, it, vi } from 'vitest'

const { countProjectCatalogOpenBySourceUrl, setSlackRequestReactions } = vi.hoisted(() => ({
  countProjectCatalogOpenBySourceUrl: vi.fn(),
  setSlackRequestReactions: vi.fn(),
}))
vi.mock('@crowd/data-access-layer', () => ({ countProjectCatalogOpenBySourceUrl }))
vi.mock('@crowd/slack', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/slack')>()),
  setSlackRequestReactions,
}))

import { applyRequestStatus, reactionsToRemove } from './botReactions'

const project = {
  id: 'row-1',
  repoUrl: 'https://github.com/acme/one',
  sourceUrl: 'https://acme.slack.com/archives/C1/p1760000000123456',
}

describe('reactionsToRemove', () => {
  it('keeps the hourglass while sibling rows are still being processed', () => {
    expect(reactionsToRemove('added', { pending: 1, inReview: 0 })).toEqual(['eyes'])
    expect(reactionsToRemove('withTeam', { pending: 2, inReview: 1 })).toEqual([])
  })

  it('drops the hourglass once nothing is pending and the eyes once nothing is in review', () => {
    expect(reactionsToRemove('withTeam', { pending: 0, inReview: 1 })).toEqual([
      'hourglass_flowing_sand',
    ])
    expect(reactionsToRemove('notAdded', { pending: 0, inReview: 1 })).toEqual([
      'hourglass_flowing_sand',
    ])
    expect(reactionsToRemove('added', { pending: 0, inReview: 0 })).toEqual([
      'hourglass_flowing_sand',
      'eyes',
    ])
    expect(reactionsToRemove('checking', { pending: 1, inReview: 0 })).toEqual(['eyes'])
  })
})

describe('applyRequestStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setSlackRequestReactions.mockResolvedValue({ ok: true })
  })

  it('adds the outcome reaction and removes the in-progress ones on the request message', async () => {
    countProjectCatalogOpenBySourceUrl.mockResolvedValue({ pending: 0, inReview: 0 })

    await applyRequestStatus({} as never, project, 'notAdded')

    expect(countProjectCatalogOpenBySourceUrl).toHaveBeenCalledWith({}, project.sourceUrl)
    expect(setSlackRequestReactions).toHaveBeenCalledWith(project.sourceUrl, {
      add: ['no_entry_sign'],
      remove: ['hourglass_flowing_sand', 'eyes'],
    })
  })

  it('does nothing without a source url and never throws on failures', async () => {
    await applyRequestStatus({} as never, { ...project, sourceUrl: null }, 'added')
    expect(setSlackRequestReactions).not.toHaveBeenCalled()

    countProjectCatalogOpenBySourceUrl.mockRejectedValue(new Error('db down'))
    await expect(applyRequestStatus({} as never, project, 'added')).resolves.toBeUndefined()
  })
})
