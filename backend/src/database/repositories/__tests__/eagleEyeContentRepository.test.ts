import lodash from 'lodash'
import moment from 'moment'
import EagleEyeContentRepository from '../eagleEyeContentRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import Error400 from '../../../errors/Error400'
import EagleEyeContentService from '../../../services/eagleEyeContentService'

const db = null

const toCreate = {
  sourceId: 'sourceId',
  vectorId: '123',
  status: null,
  platform: 'hacker_news',
  title: 'title',
  userAttributes: { github: 'hey', twitter: 'ho' },
  text: 'text',
  postAttributes: {
    score: 10,
  },
  url: 'url',
  timestamp: new Date(),
  username: 'username',
  keywords: ['keyword1', 'keyword2'],
  similarityScore: 0.9,
}

const toCreateMinimal = {
  sourceId: 'sourceIdMinimal',
  vectorId: '456',
  platform: 'hacker_news',
  url: 'url',
  title: 'title minimal',
  timestamp: new Date(),
  username: 'username',
  keywords: 'keyword',
}

const forFiltering = [
  toCreate,
  toCreateMinimal,
  {
    sourceId: 'devto123',
    vectorId: '123123',
    status: 'engaged',
    url: 'devto url',
    username: 'devtousername1',
    platform: 'devto',
    timestamp: moment().toDate(),
    title: 'title devto 1',
  },
  {
    sourceId: 'devto456',
    vectorId: '123456',
    url: 'url devto 2',
    username: 'devtousername2',
    status: 'rejected',
    platform: 'devto',
    timestamp: moment().subtract(1, 'week').toDate(),
    title: 'title devto 2',
    keywords: ['keyword1', 'keyword2'],
    score: 40,
  },
  {
    sourceId: 'devto789',
    vectorId: '123456',
    url: 'url devto 3',
    username: 'devtousername3',
    status: null,
    platform: 'devto',
    timestamp: moment().subtract(1, 'week').toDate(),
    keywords: ['keyword3', 'keyword2'],
    title: 'title devto 3',
  },
]

async function addAll(options) {
  await Promise.all(forFiltering.map((item) => EagleEyeContentRepository.upsert(item, options)))
}

describe('eagleEyeContentRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('upserts method', () => {
    it('Should create a complete content succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const created = await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      created.createdAt = created.createdAt.toISOString().split('T')[0]
      created.updatedAt = created.updatedAt.toISOString().split('T')[0]

      const expectedCreated = {
        id: created.id,
        ...toCreate,
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
        userAttributes: { github: 'hey', twitter: 'ho' },
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

    it('Should not add it the record already exists', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      const count = await mockIRepositoryOptions.database.eagleEyeContent.count()
      expect(count).toBe(1)
    })

    it('Should update keywords and similarity score if the item already exists', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await EagleEyeContentRepository.upsert(toCreate, mockIRepositoryOptions)

      const toCreateNewKeywords = { ...toCreate }
      toCreateNewKeywords.keywords = ['1', '2', 'keyword1']
      toCreateNewKeywords.similarityScore = 0.95

      const allKeywords = ['1', '2', 'keyword1', 'keyword2']

      const created = await EagleEyeContentRepository.upsert(
        toCreateNewKeywords,
        mockIRepositoryOptions,
      )

      const count = await mockIRepositoryOptions.database.eagleEyeContent.count()
      expect(count).toBe(1)
      expect(lodash.isEqual(created.keywords.sort(), allKeywords.sort()))
      expect(created.similarityScore).toBe(0.95)
    })

    it('Should create a minimal content succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const created = await EagleEyeContentRepository.upsert(
        toCreateMinimal,
        mockIRepositoryOptions,
      )

      created.createdAt = created.createdAt.toISOString().split('T')[0]
      created.updatedAt = created.updatedAt.toISOString().split('T')[0]

      const expectedCreated = {
        id: created.id,
        ...toCreateMinimal,
        text: null,
        status: null,
        userAttributes: null,
        postAttributes: null,
        similarityScore: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(created).toStrictEqual(expectedCreated)
      expect(created.status).toBe(null)
    })

    it('Should create with rejected status', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const newStatus = { ...toCreate }
      newStatus.status = 'rejected'

      const created = await EagleEyeContentRepository.upsert(newStatus, mockIRepositoryOptions)

      created.createdAt = created.createdAt.toISOString().split('T')[0]
      created.updatedAt = created.updatedAt.toISOString().split('T')[0]

      const expectedCreated = {
        id: created.id,
        ...newStatus,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(created).toStrictEqual(expectedCreated)
      expect(created.status).toBe('rejected')
    })

    it('Should create with engaged status', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const newStatus = { ...toCreate }
      newStatus.status = 'engaged'

      const created = await EagleEyeContentRepository.upsert(newStatus, mockIRepositoryOptions)

      created.createdAt = created.createdAt.toISOString().split('T')[0]
      created.updatedAt = created.updatedAt.toISOString().split('T')[0]

      const expectedCreated = {
        id: created.id,
        ...newStatus,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(created).toStrictEqual(expectedCreated)
      expect(created.status).toBe('engaged')
    })

    it('Should throw an error for an invalid status', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const newStatus = { ...toCreate }
      newStatus.status = 'smth else'

      await expect(() =>
        EagleEyeContentRepository.upsert(newStatus, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error400('en', 'errors.invalidEagleEyeStatus.message'))
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
      ).toBe(2)
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
})
