import { EagleEyeAction, EagleEyeActionType, EagleEyeContent } from '@crowd/types'
import EagleEyeContentRepository from '../eagleEyeContentRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import EagleEyeActionRepository from '../eagleEyeActionRepository'

const db = null

describe('eagleEyeActionRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('createActionForContent method', () => {
    it('Should create a an action for a content succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const content = {
        platform: 'reddit',
        url: 'https://some-post-url',
        post: {
          title: 'post title',
          body: 'post body',
        },
        postedAt: '2020-05-27T15:13:30Z',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      } as EagleEyeContent

      const contentCreated = await EagleEyeContentRepository.create(content, mockIRepositoryOptions)

      const action: EagleEyeAction = {
        type: EagleEyeActionType.BOOKMARK,
        timestamp: '2022-07-27T19:13:30Z',
      }

      const actionCreated = await EagleEyeActionRepository.createActionForContent(
        action,
        contentCreated.id,
        mockIRepositoryOptions,
      )

      actionCreated.createdAt = (actionCreated.createdAt as Date).toISOString().split('T')[0]
      actionCreated.updatedAt = (actionCreated.updatedAt as Date).toISOString().split('T')[0]

      const expectedAction = {
        id: actionCreated.id,
        ...action,
        timestamp: new Date(actionCreated.timestamp),
        contentId: contentCreated.id,
        actionById: mockIRepositoryOptions.currentUser.id,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
      }
      expect(expectedAction).toStrictEqual(actionCreated)
    })
  })
})
