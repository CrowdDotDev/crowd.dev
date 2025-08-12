import { fetchIntegrationById } from '@crowd/data-access-layer/src/integrations'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CollectionService } from '../collectionService'

// If PlatformType is exported elsewhere, import it. For the test we can just use the string.
const GITHUB_NANGO = 'GITHUB_NANGO' as any

jest.mock('../../database/repositories/integrationRepository', () => ({
    __esModule: true,
    fetchIntegrationById: jest.fn(),
}))

// SequelizeRepository is a class with static methods; we won't fully mock the module,
// we’ll spy/override the specific static methods used by the service.
describe('CollectionService.findNangoRepositoriesToBeRemoved', () => {
    let service: CollectionService

    beforeEach(() => {
        jest.resetAllMocks()
        // @ts-expect-error - options shape not important for this unit
        service = new CollectionService({})

        // withTx should just invoke the callback and return its result
        jest.spyOn(SequelizeRepository, 'withTx').mockImplementation(
            // @ts-ignore – simplify signature for the test
            async (_opts, cb) => cb({} as any),
        )

        // getQueryExecutor can return any token/value; it’s only passed through
        jest.spyOn(SequelizeRepository, 'getQueryExecutor').mockReturnValue({} as any)
    })

    it('returns [] if integration not found', async () => {
        ; (fetchIntegrationById as jest.Mock).mockResolvedValue(null)

        const result = await service.findNangoRepositoriesToBeRemoved('int-1')
        expect(result).toEqual([])
        expect(fetchIntegrationById).toHaveBeenCalled()
    })

    //   it('returns [] if platform is not GITHUB_NANGO', async () => {
    //     ;(fetchIntegrationById as jest.Mock).mockResolvedValue({
    //       id: 'int-1',
    //       platform: 'SOME_OTHER_PLATFORM',
    //       settings: {},
    //     })

    //     const result = await service.findNangoRepositoriesToBeRemoved('int-1')
    //     expect(result).toEqual([])
    //   })

    //   it('returns [] if settings.nangoMapping is missing', async () => {
    //     ;(fetchIntegrationById as jest.Mock).mockResolvedValue({
    //       id: 'int-1',
    //       platform: GITHUB_NANGO,
    //       settings: { orgs: [], repos: [] }, // no nangoMapping
    //     })

    //     const result = await service.findNangoRepositoriesToBeRemoved('int-1')
    //     expect(result).toEqual([])
    //   })

    //   it('returns repo URLs that are in nangoMapping but NOT in selected orgs/repos', async () => {
    //     // Selected repos (via orgs + repos) – only "kept/repo" should be kept
    //     const settings = {
    //       orgs: [
    //         {
    //           repos: [
    //             { url: 'https://github.com/kept/repo' }, // this one should stay
    //           ],
    //         },
    //       ],
    //       repos: [
    //         { url: 'https://github.com/also/selected' }, // selected but not in mapping -> irrelevant to removal
    //       ],
    //       nangoMapping: {
    //         // two that should be removed:
    //         a: { owner: 'foo', repoName: 'bar' },
    //         b: { owner: 'baz', repoName: 'qux' },
    //         // one that should be kept because it's selected above:
    //         c: { owner: 'kept', repoName: 'repo' },
    //       },
    //     }

    //     ;(fetchIntegrationById as jest.Mock).mockResolvedValue({
    //       id: 'int-1',
    //       platform: GITHUB_NANGO,
    //       settings,
    //     })

    //     // Optional: ensure slug extraction is invoked; let it run through
    //     const slugSpy = jest.spyOn(CollectionService as any, 'extractGithubRepoSlug')

    //     const result = await service.findNangoRepositoriesToBeRemoved('int-1')

    //     // Order doesn’t matter
    //     expect(result.sort()).toEqual(
    //       ['https://github.com/foo/bar', 'https://github.com/baz/qux'].sort(),
    //     )

    //     // Sanity check that slug extraction was used for selected repos
    //     expect(slugSpy).toHaveBeenCalledWith('https://github.com/kept/repo')
    //     expect(slugSpy).toHaveBeenCalledWith('https://github.com/also/selected')
    //   })

    //   it('handles empty orgs/repos gracefully', async () => {
    //     const settings = {
    //       orgs: [], // none selected
    //       repos: undefined, // none selected
    //       nangoMapping: {
    //         a: { owner: 'only', repoName: 'mapped' },
    //       },
    //     }

    //     ;(fetchIntegrationById as jest.Mock).mockResolvedValue({
    //       id: 'int-1',
    //       platform: GITHUB_NANGO,
    //       settings,
    //     })

    //     const result = await service.findNangoRepositoriesToBeRemoved('int-1')
    //     expect(result).toEqual(['https://github.com/only/mapped'])
    //   })
})
