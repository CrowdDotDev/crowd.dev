import * as Integrations from '@crowd/data-access-layer/src/integrations'
import { PlatformType } from '@crowd/types'

import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CollectionService } from '../collectionService'

describe('CollectionService.findNangoRepositoriesToBeRemoved', () => {
  let service: CollectionService

  const INTEGRATION_ID = 'int-1'
  const buildIntegration = (settings: any, platform: any = PlatformType.GITHUB_NANGO) => ({
    id: INTEGRATION_ID,
    platform,
    settings,
  })
  const mockFetchIntegrationById = (integration: any | null) => {
    jest.spyOn(Integrations, 'fetchIntegrationById').mockResolvedValue(integration as any)
  }

  beforeEach(() => {
    jest.resetAllMocks()

    // @ts-expect-error - options shape not important for this unit
    service = new CollectionService({})
    jest.spyOn(SequelizeRepository, 'withTx').mockImplementation(async (_opts, cb) => cb({} as any))
    jest.spyOn(SequelizeRepository, 'getQueryExecutor').mockReturnValue({} as any)
  })

  it('returns [] if integration not found', async () => {
    mockFetchIntegrationById(null)

    const result = await service.findNangoRepositoriesToBeRemoved('non-existent-id')
    expect(result).toEqual([])
  })

  it('returns [] if platform is not GITHUB_NANGO', async () => {
    mockFetchIntegrationById(buildIntegration({ orgs: [], repos: [] }, 'NOT_GITHUB_NANGO'))

    const result = await service.findNangoRepositoriesToBeRemoved(INTEGRATION_ID)
    expect(result).toEqual([])
  })

  it('returns [] if settings.nangoMapping is missing', async () => {
    mockFetchIntegrationById(buildIntegration({ orgs: [], repos: [] }, PlatformType.GITHUB_NANGO))

    const result = await service.findNangoRepositoriesToBeRemoved(INTEGRATION_ID)
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

    mockFetchIntegrationById(buildIntegration(settings))

    const result = await service.findNangoRepositoriesToBeRemoved(INTEGRATION_ID)

    expect(result).toEqual(
      expect.arrayContaining(['https://github.com/foo/bar', 'https://github.com/baz/qux']),
    )
    expect(result).toHaveLength(2)
  })

  it('handles empty orgs/repos gracefully', async () => {
    const settings = {
      orgs: [],
      repos: undefined,
      nangoMapping: {
        a: { owner: 'only', repoName: 'mapped' },
      },
    }

    mockFetchIntegrationById(buildIntegration(settings))

    const result = await service.findNangoRepositoriesToBeRemoved(INTEGRATION_ID)
    expect(result).toEqual(['https://github.com/only/mapped'])
  })
})
