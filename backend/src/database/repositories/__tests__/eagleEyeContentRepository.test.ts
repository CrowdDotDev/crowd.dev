import { EagleEyeActionType, EagleEyeContent } from '@crowd/types'
import EagleEyeContentRepository from '../eagleEyeContentRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import EagleEyeActionRepository from '../eagleEyeActionRepository'

const db = null

describe('eagleEyeContentRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create a content succesfully', async () => {
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

      const created = await EagleEyeContentRepository.create(content, mockIRepositoryOptions)

      created.createdAt = (created.createdAt as Date).toISOString().split('T')[0]
      created.updatedAt = (created.updatedAt as Date).toISOString().split('T')[0]

      const expectedCreated = {
        id: created.id,
        ...content,
        postedAt: new Date(content.postedAt),
        actions: [],
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
      }
      expect(created).toStrictEqual(expectedCreated)
    })

    /*

    it('Should create a content with unix timestamp', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const withUnix = {
        sourceId: 'sourceId',
        vectorId: '123',
        status: null,
        platform: 'hacker_news',
        title: 'title',
        postAttributes: {
          score: 10,
        },
        userAttributes: { [PlatformType.GITHUB]: 'hey', [PlatformType.TWITTER]: 'ho' },
        text: 'text',
        url: 'url',
        timestamp: 1660712134,

        username: 'username',
        keywords: ['keyword1', 'keyword2'],
        similarityScore: 0.9,
      }

      const created = await EagleEyeContentRepository.upsert(withUnix, mockIRepositoryOptions)

      created.createdAt = created.createdAt.toISOString().split('T')[0]
      created.updatedAt = created.updatedAt.toISOString().split('T')[0]

      const expectedCreated = {
        id: created.id,
        ...toCreate,
        timestamp: new Date(1660712134 * 1000),
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(created).toStrictEqual(expectedCreated)
    })

    

  
  })

  describe('find by id method', () => {
    it('Should find an existing record', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const created = await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      const id = created.id
      const found = await EagleEyeContentRepository.findById(id, mockIRepositoryOptions)
      expect(found.id).toBe(id)
    })

    it('Should throw 404 error when no tag found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        EagleEyeContentRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('find and count all method', () => {
    it('Should find all records without filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        { filter: {} },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(5)
    })

    it('Filter by date', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            timestampRange: [moment().subtract(1, 'day').toISOString()],
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(3)
    })

    it('Filter by nDays', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            nDays: 1,
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(3)
    })

    it('Filter by status NULL', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            status: 'NULL',
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(3)
    })

    it('Filter by status NOT_NULL', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            status: 'NOT_NULL',
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(2)
    })

    it('Filter by status engaged', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            status: 'engaged',
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(1)
    })

    it('Filter by status rejected', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            status: 'rejected',
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(1)
    })

    it('Filter by platform', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            platforms: 'hacker_news',
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(2)
    })

    it('Filter by several platforms', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)
      await new EagleEyeContentService(mockIRepositoryOptions).upsert({
        sourceId: 't1',
        vectorId: 't1',
        url: 'url devto 3',
        username: 'devtousername3',
        status: null,
        platform: 'twitter',
        timestamp: moment().subtract(1, 'week').toDate(),
        keywords: ['keyword3', 'keyword2'],
        title: 'title devto 3',
      })

      const found = await EagleEyeContentRepository.findAndCountAll(
        {
          filter: {
            platforms: 'hacker_news,twitter',
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(3)
    })

    it('Filter by timestamp and status', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      expect(
        (
          await EagleEyeContentRepository.findAndCountAll(
            {
              filter: {
                timestampRange: [moment().subtract(1, 'day').toISOString()],
                status: 'NULL',
              },
            },
            mockIRepositoryOptions,
          )
        ).count,
      ).toBe(2)
    })

    it('Filter by keywords', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await addAll(mockIRepositoryOptions)

      const k1 = {
        sourceId: 'sourceIdk1',
        vectorId: 'sourceIdk1',
        status: null,
        platform: 'hacker_news',
        title: 'title',
        userAttributes: { [PlatformType.GITHUB]: 'hey', [PlatformType.TWITTER]: 'ho' },
        text: 'text',
        postAttributes: {
          score: 10,
        },
        url: 'url',
        timestamp: new Date(),
        username: 'username',
        keywords: ['keyword1'],
        similarityScore: 0.9,
      }

      await new EagleEyeContentService(mockIRepositoryOptions).upsert(k1)

      const k2 = {
        sourceId: 'sourceIdk2',
        vectorId: 'sourceIdk2',
        status: null,
        platform: 'hacker_news',
        title: 'title',
        userAttributes: { [PlatformType.GITHUB]: 'hey', [PlatformType.TWITTER]: 'ho' },
        text: 'text',
        postAttributes: {
          score: 10,
        },
        url: 'url',
        timestamp: new Date(),
        username: 'username',
        keywords: ['keyword2'],
        similarityScore: 0.9,
      }

      try {
        await EagleEyeContentRepository.findAndCountAll(
          {
            filter: {
              keywords: 'keyword1,keyword2',
            },
          },
          mockIRepositoryOptions,
        )
      } catch (e) {
        console.log(e)
      }

      await new EagleEyeContentService(mockIRepositoryOptions).upsert(k2)

      expect(
        (
          await EagleEyeContentRepository.findAndCountAll(
            {
              filter: {
                keywords: 'keyword1,keyword2',
              },
            },
            mockIRepositoryOptions,
          )
        ).count,
      ).toBe(5)
    })
  })

  describe('update method', () => {
    it('Should update a record', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const created = await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      const id = created.id
      const updated = await EagleEyeContentRepository.update(
        id,
        { status: 'rejected', username: 'updated' },
        mockIRepositoryOptions,
      )
      expect(updated.id).toBe(id)
      expect(updated.status).toBe('rejected')
      expect(updated.username).toBe('updated')
    })

    it('Should throw 404 error when no content found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        EagleEyeContentRepository.update(randomUUID(), {}, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw an error for an invalid status', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const created = await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      const id = created.id

      await expect(() =>
        EagleEyeContentRepository.update(id, { status: 'smth' }, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error400('en', 'errors.invalidEagleEyeStatus.message'))
    })

    it('Keywords should not be updated', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const created = await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      const id = created.id
      const updated = await EagleEyeContentRepository.update(
        id,
        { keywords: ['1', '2'] },
        mockIRepositoryOptions,
      )
      expect(updated.id).toBe(id)
      expect(updated.keywords).toStrictEqual(created.keywords)
    })
  })
  */
  })

  describe('findAndCountAll method', () => {
    it('Should find eagle eye contant, various cases', async () => {
      // create random tenant with one user
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // create additional users for same tenant to test out actionBy filtering
      const randomUser = await SequelizeTestUtils.getRandomUser()

      console.log('random user: ')
      console.log(randomUser)

      const user2 = await mockIRepositoryOptions.database.user.create(randomUser)

      await mockIRepositoryOptions.database.tenantUser.create({
        roles: ['admin'],
        status: 'active',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        userId: user2.id,
      })

      // create few content
      // one without any actions
      await EagleEyeContentRepository.create(
        {
          platform: 'reddit',
          url: 'https://some-reddit-url',
          post: {
            title: 'post title',
            body: 'post body',
          },
          postedAt: '2020-05-27T15:13:30Z',
          tenantId: mockIRepositoryOptions.currentTenant.id,
        },
        mockIRepositoryOptions,
      )

      // one with a bookmark action
      let c2 = await EagleEyeContentRepository.create(
        {
          platform: 'hackernews',
          url: 'https://some-hackernews-url',
          post: {
            title: 'post title',
            body: 'post body',
          },
          postedAt: '2022-06-27T19:14:44Z',
          tenantId: mockIRepositoryOptions.currentTenant.id,
        },
        mockIRepositoryOptions,
      )

      // add bookmark action
      await EagleEyeActionRepository.createActionForContent(
        {
          type: EagleEyeActionType.BOOKMARK,
          timestamp: '2022-07-27T19:13:30Z',
        },
        c2.id,
        mockIRepositoryOptions,
      )

      c2 = await EagleEyeContentRepository.findById(c2.id, mockIRepositoryOptions)

      // another content with a thumbs-up(user1) and a bookmark(user2) action
      let c3 = await EagleEyeContentRepository.create(
        {
          platform: 'devto',
          url: 'https://some-devto-url',
          post: {
            title: 'post title',
            body: 'post body',
          },
          postedAt: '2022-06-27T19:14:44Z',
          tenantId: mockIRepositoryOptions.currentTenant.id,
        },
        mockIRepositoryOptions,
      )

      // add the thumbs up action
      await EagleEyeActionRepository.createActionForContent(
        {
          type: EagleEyeActionType.THUMBS_UP,
          timestamp: '2022-09-30T23:11:10Z',
        },
        c3.id,
        mockIRepositoryOptions,
      )

      // also add bookmark from user2
      await EagleEyeActionRepository.createActionForContent(
        {
          type: EagleEyeActionType.BOOKMARK,
          timestamp: '2022-09-30T23:11:10Z',
        },
        c3.id,
        { ...mockIRepositoryOptions, currentUser: user2 },
      )

      c3 = await EagleEyeContentRepository.findById(c3.id, mockIRepositoryOptions)

      // filter by action type
      let res = await EagleEyeContentRepository.findAndCountAll(
        {
          advancedFilter: {
            action: {
              type: EagleEyeActionType.BOOKMARK,
            },
          },
        },
        mockIRepositoryOptions,
      )

      expect(res.count).toBe(2)
      expect(res.rows.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))).toStrictEqual([c2, c3])

      // filter by actionBy
      res = await EagleEyeContentRepository.findAndCountAll(
        {
          advancedFilter: {
            action: {
              actionById: user2.id,
            },
          },
        },
        mockIRepositoryOptions,
      )

      expect(res.count).toBe(1)
      expect(res.rows).toStrictEqual([c3])
    })
  })
})
