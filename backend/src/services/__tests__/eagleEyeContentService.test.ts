import { EagleEyeActionType, EagleEyeContent } from '@crowd/types'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import EagleEyeContentService from '../eagleEyeContentService'

const db = null

describe('EagleEyeContentService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('upsert method', () => {
    it('Should create or update a single content using URL field', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const content: EagleEyeContent = {
        platform: 'reddit',
        url: 'https://some-post-url',
        post: {
          title: 'post title',
          body: 'post body',
        },
        postedAt: '2020-05-27T15:13:30Z',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        actions: [
          {
            type: EagleEyeActionType.BOOKMARK,
            timestamp: '2022-06-27T14:13:30Z',
          },
        ],
      }

      const service = new EagleEyeContentService(mockIRepositoryOptions)
      const c1 = await service.upsert(content)

      let contents = await service.query({})

      expect(contents.count).toBe(1)
      expect(contents.rows).toStrictEqual([c1])

      // upsert previous url with some new fields
      const contentWithSameUrl: EagleEyeContent = {
        platform: 'reddit',
        url: 'https://some-post-url',
        post: {
          title: 'a brand new post title',
          body: 'better post body',
        },
        postedAt: '2020-05-27T15:13:30Z',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      }

      const c1Upserted = await service.upsert(contentWithSameUrl)

      contents = await service.query({})
      expect(contents.count).toBe(1)
      expect(contents.rows).toStrictEqual([c1Upserted])
      expect(c1Upserted.id).toEqual(c1.id)
      expect(contents.rows[0].post).toStrictEqual(contentWithSameUrl.post)
    })
  })
})
