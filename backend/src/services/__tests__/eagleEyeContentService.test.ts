import moment from 'moment'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import EagleEyeContentService from '../eagleEyeContentService'

const db = null

const toUpsert = {
  keywords: ['keyword'],
  similarityScore: 1,
  userAttributes: {
    github: 'github',
  },
  username: 'username',
  timestamp: moment().unix(),
  url: 'url',
  title: 'title',
  text: 'text',
  platform: 'platform',
  sourceId: 'sourceId',
  vectorId: '1234',
  status: null,
}

const toUpsert2 = {
  keywords: ['keyword'],
  similarityScore: 1,
  userAttributes: {
    github: 'github',
  },
  username: 'username',
  timestamp: moment().subtract(1, 'days').unix(),
  url: 'url',
  title: 'title',
  text: 'text',
  platform: 'platform',
  sourceId: 'sourceId2',
  vectorId: '12345',
  status: null,
}

describe('EagleEyeContentService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('bulk upsert method', () => {
    it('Should upsert a single record', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const service = new EagleEyeContentService(mockIRepositoryOptions)
      await service.bulkUpsert([toUpsert])
      const result = await service.findAndCountAll({})
      expect(result.count).toBe(1)
    })

    it('Should upsert a single record', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const service = new EagleEyeContentService(mockIRepositoryOptions)
      await service.bulkUpsert([toUpsert])
      await service.bulkUpsert([toUpsert2])
      const result = await service.findAndCountAll({})
      expect(result.count).toBe(2)
    })
  })

  describe('findAndCount all method', () => {
    it('Should find records', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const service = new EagleEyeContentService(mockIRepositoryOptions)
      await service.bulkUpsert([toUpsert])
      await service.bulkUpsert([toUpsert2])
      const result = await service.findAndCountAll({})

      expect(result.count).toBe(2)
      expect(result.rows[1].vectorId).toBe(toUpsert.vectorId)
      expect(result.rows[0].vectorId).toBe(toUpsert2.vectorId)
    })

    it('Should work when no records', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const service = new EagleEyeContentService(mockIRepositoryOptions)
      const result = await service.findAndCountAll({})
      expect(result.count).toBe(0)
    })
  })

  describe('findNotInbox method', () => {
    it('4 records: 2 have status null, one is too old. Return 1', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const service = new EagleEyeContentService(mockIRepositoryOptions)

      const nInbox1 = {
        keywords: ['keyword'],
        similarityScore: 1,
        userAttributes: {
          github: 'github',
        },
        username: 'username',
        timestamp: moment().unix(),
        url: 'url',
        title: 'title',
        text: 'text',
        platform: 'platform',
        sourceId: 'p-321',
        vectorId: '321',
        status: 'rejected',
      }

      const nInbox2 = {
        keywords: ['keyword'],
        similarityScore: 1,
        userAttributes: {
          github: 'github',
        },
        username: 'username',
        timestamp: moment().subtract(31, 'days').unix(),
        url: 'url',
        title: 'title',
        text: 'text',
        platform: 'platform',
        sourceId: 'p-4321',
        vectorId: '4321',
        status: 'engaged',
      }

      await service.bulkUpsert([toUpsert, nInbox1, nInbox2, toUpsert2])

      const result = await service.findNotInbox()

      expect(result.length).toBe(1)
      expect(result[0]).toBe(nInbox1.vectorId)
    })
  })
})
