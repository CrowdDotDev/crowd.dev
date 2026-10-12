import { describe, expect, it, vi } from 'vitest'

import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { loadBatchRepoLookups } from './requestClassifierDeps'

const dal = vi.hoisted(() => ({
  findRepoUrlsInCdp: vi.fn(),
  findGithubOwnersWithLfProjects: vi.fn(),
  findGithubOwnersWithNonLfRepos: vi.fn(),
}))

vi.mock('@crowd/data-access-layer/src/repositories', () => dal)
vi.mock('@crowd/common_services', () => ({ LlmService: vi.fn() }))
vi.mock('@crowd/snowflake', () => ({ SnowflakeClient: { fromEnv: vi.fn() } }))

const qx = {} as QueryExecutor

describe('loadBatchRepoLookups', () => {
  it('queries tracked repos and owners once and answers lookups from the loaded sets', async () => {
    dal.findRepoUrlsInCdp.mockResolvedValue(new Set(['https://github.com/acme/widget']))
    dal.findGithubOwnersWithLfProjects.mockResolvedValue(new Set(['acme', 'kubernetes']))
    dal.findGithubOwnersWithNonLfRepos.mockResolvedValue(new Set(['acme']))

    const lookups = await loadBatchRepoLookups(qx, [
      'https://github.com/acme/widget',
      'https://github.com/Acme/Widget.git',
      'https://github.com/kubernetes/kubernetes',
      'https://gitlab.com/group/project',
    ])

    expect(dal.findRepoUrlsInCdp).toHaveBeenCalledWith(qx, [
      'https://github.com/acme/widget',
      'https://github.com/kubernetes/kubernetes',
    ])
    expect(dal.findGithubOwnersWithLfProjects).toHaveBeenCalledWith(qx, ['acme', 'kubernetes'])
    expect(dal.findGithubOwnersWithNonLfRepos).toHaveBeenCalledWith(qx, ['acme', 'kubernetes'])

    await expect(
      lookups.findTrackedRepoUrls([
        'https://github.com/acme/widget',
        'https://github.com/kubernetes/kubernetes',
      ]),
    ).resolves.toEqual(new Set(['https://github.com/acme/widget']))
    await expect(lookups.findExclusivelyLfOwners(['acme', 'kubernetes'])).resolves.toEqual(
      new Set(['kubernetes']),
    )
    expect(dal.findRepoUrlsInCdp).toHaveBeenCalledTimes(1)
  })
})
