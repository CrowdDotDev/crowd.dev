import * as Integrations from '@crowd/data-access-layer/src/integrations'
import { PlatformType } from '@crowd/types'

import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CollectionService } from '../collectionService'

describe('CollectionService.findNangoRepositoriesToBeRemoved', () => {
  let service: CollectionService

  beforeEach(() => {
    jest.resetAllMocks()

    // @ts-expect-error - options shape not important for this unit
    service = new CollectionService({})
    jest.spyOn(SequelizeRepository, 'withTx').mockImplementation(async (_opts, cb) => cb({} as any))
    jest.spyOn(SequelizeRepository, 'getQueryExecutor').mockReturnValue({} as any)
  })

  it('returns [] if integration not found', async () => {
    jest.spyOn(Integrations, 'fetchIntegrationById').mockResolvedValue(null)

    const result = await service.findNangoRepositoriesToBeRemoved('non-existent-id')
    expect(result).toEqual([])
  })

  it('returns [] if platform is not GITHUB_NANGO', async () => {
    jest.spyOn(Integrations, 'fetchIntegrationById').mockResolvedValue({
      id: 'int-1',
      platform: 'NOT_GITHUB_NANGO',
      settings: { orgs: [], repos: [] },
    })

    const result = await service.findNangoRepositoriesToBeRemoved('int-1')
    expect(result).toEqual([])
  })

  it('returns [] if settings.nangoMapping is missing', async () => {
    jest.spyOn(Integrations, 'fetchIntegrationById').mockResolvedValue({
      id: 'int-1',
      platform: 'GITHUB_NANGO',
      settings: { orgs: [], repos: [] },
    })

    const result = await service.findNangoRepositoriesToBeRemoved('int-1')
    expect(result).toEqual([])
  })

  it('returns repo URLs that are in nangoMapping but NOT in selected orgs/repos', async () => {
    const settings = {
      orgs: [
        {
          repos: [{ url: 'https://github.com/kept/repo' }],
        },
      ],
      repos: [{ url: 'https://github.com/also/selected' }],
      nangoMapping: {
        a: { owner: 'foo', repoName: 'bar' },
        b: { owner: 'baz', repoName: 'qux' },
        c: { owner: 'kept', repoName: 'repo' },
      },
    }

    jest.spyOn(Integrations, 'fetchIntegrationById').mockResolvedValue({
      id: 'int-1',
      platform: PlatformType.GITHUB_NANGO,
      settings,
    })

    const result = await service.findNangoRepositoriesToBeRemoved('int-1')

    expect(result.sort()).toEqual(
      ['https://github.com/foo/bar', 'https://github.com/baz/qux'].sort(),
    )
  })

  it('handles empty orgs/repos gracefully', async () => {
    const settings = {
      orgs: [],
      repos: undefined,
      nangoMapping: {
        a: { owner: 'only', repoName: 'mapped' },
      },
    }

    jest.spyOn(Integrations, 'fetchIntegrationById').mockResolvedValue({
      id: 'int-1',
      platform: PlatformType.GITHUB_NANGO,
      settings,
    })

    const result = await service.findNangoRepositoriesToBeRemoved('int-1')
    expect(result).toEqual(['https://github.com/only/mapped'])
  })
})
