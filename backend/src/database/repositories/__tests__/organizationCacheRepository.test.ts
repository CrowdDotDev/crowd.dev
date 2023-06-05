import organizationCacheRepository from '../organizationCacheRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'

const db = null

const toCreate = {
  name: 'crowd.dev',
  url: 'https://crowd.dev',
  description: 'Community-led Growth for Developer-first Companies.\nJoin our private beta',
  emails: ['hello@crowd.dev', 'jonathan@crow.dev'],
  phoneNumbers: ['+42 424242424'],
  logo: 'https://logo.clearbit.com/crowd.dev',
  tags: ['community', 'growth', 'developer-first'],
  parentUrl: null,
  website: 'https://crowd.dev',
  location: 'Berlin',
  github: {
    handle: 'CrowdDotDev',
  },
  twitter: {
    handle: 'CrowdDotDev',
    id: '1362101830923259908',
    bio: 'Community-led Growth for Developer-first Companies.\nJoin our private beta. 👇',
    followers: 107,
    following: 0,
    location: '🌍 remote',
    site: 'https://t.co/GRLDhqFWk4',
    avatar: 'https://pbs.twimg.com/profile_images/1419741008716251141/6exZe94-_normal.jpg',
  },
  linkedin: {
    handle: 'company/crowddevhq',
  },
  crunchbase: {
    handle: 'company/crowddevhq',
  },
  employees: 42,
  revenueRange: {
    min: 10,
    max: 50,
  },
  type: null,
  ticker: null,
  size: null,
  naics: null,
  lastEnrichedAt: null,
  industry: null,
  headline: null,
  geoLocation: null,
  founded: null,
  employeeCountByCountry: null,
  address: null,
}

describe('OrganizationCacheCacheRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create the given organizationCache succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCacheCreated = await organizationCacheRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCacheCreated.createdAt = organizationCacheCreated.createdAt
        .toISOString()
        .split('T')[0]
      organizationCacheCreated.updatedAt = organizationCacheCreated.updatedAt
        .toISOString()
        .split('T')[0]

      const expectedorganizationCacheCreated = {
        id: organizationCacheCreated.id,
        ...toCreate,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
      }
      expect(organizationCacheCreated).toStrictEqual(expectedorganizationCacheCreated)
    })

    it('Should throw sequelize not null error -- name field is required', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCache2add = {}

      await expect(() =>
        organizationCacheRepository.create(organizationCache2add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created organizationCache by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCacheCreated = await organizationCacheRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCacheCreated.createdAt = organizationCacheCreated.createdAt
        .toISOString()
        .split('T')[0]
      organizationCacheCreated.updatedAt = organizationCacheCreated.updatedAt
        .toISOString()
        .split('T')[0]

      const expectedorganizationCacheFound = {
        id: organizationCacheCreated.id,
        ...toCreate,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
      }
      const organizationCacheById = await organizationCacheRepository.findById(
        organizationCacheCreated.id,
        mockIRepositoryOptions,
      )

      organizationCacheById.createdAt = organizationCacheById.createdAt.toISOString().split('T')[0]
      organizationCacheById.updatedAt = organizationCacheById.updatedAt.toISOString().split('T')[0]

      expect(organizationCacheById).toStrictEqual(expectedorganizationCacheFound)
    })

    it('Should throw 404 error when no organizationCache found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        organizationCacheRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('findByUrl method', () => {
    it('Should successfully find created organizationCache by URL', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCacheCreated = await organizationCacheRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCacheCreated.createdAt = organizationCacheCreated.createdAt
        .toISOString()
        .split('T')[0]
      organizationCacheCreated.updatedAt = organizationCacheCreated.updatedAt
        .toISOString()
        .split('T')[0]

      const expectedorganizationCacheFound = {
        id: organizationCacheCreated.id,
        ...toCreate,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
      }
      const organizationCacheById = await organizationCacheRepository.findByUrl(
        organizationCacheCreated.url,
        mockIRepositoryOptions,
      )

      organizationCacheById.createdAt = organizationCacheById.createdAt.toISOString().split('T')[0]
      organizationCacheById.updatedAt = organizationCacheById.updatedAt.toISOString().split('T')[0]

      expect(organizationCacheById).toStrictEqual(expectedorganizationCacheFound)
    })

    it('Should be independend of tenant', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mock2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCacheCreated = await organizationCacheRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCacheCreated.createdAt = organizationCacheCreated.createdAt
        .toISOString()
        .split('T')[0]
      organizationCacheCreated.updatedAt = organizationCacheCreated.updatedAt
        .toISOString()
        .split('T')[0]

      const expectedorganizationCacheFound = {
        id: organizationCacheCreated.id,
        ...toCreate,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
      }
      const organizationCacheById = await organizationCacheRepository.findByUrl(
        organizationCacheCreated.url,
        mock2,
      )

      organizationCacheById.createdAt = organizationCacheById.createdAt.toISOString().split('T')[0]
      organizationCacheById.updatedAt = organizationCacheById.updatedAt.toISOString().split('T')[0]

      expect(organizationCacheById).toStrictEqual(expectedorganizationCacheFound)
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created organizationCache', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCacheCreated = await organizationCacheRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      const organizationCacheUpdated = await organizationCacheRepository.update(
        organizationCacheCreated.id,
        { name: 'updated-organizationCache-name' },
        mockIRepositoryOptions,
      )

      expect(organizationCacheUpdated.updatedAt.getTime()).toBeGreaterThan(
        organizationCacheUpdated.createdAt.getTime(),
      )

      const organizationCacheExpected = {
        id: organizationCacheCreated.id,
        ...toCreate,
        name: organizationCacheUpdated.name,
        importHash: null,
        createdAt: organizationCacheCreated.createdAt,
        updatedAt: organizationCacheUpdated.updatedAt,
        deletedAt: null,
      }

      expect(organizationCacheUpdated).toStrictEqual(organizationCacheExpected)
    })

    it('Should throw 404 error when trying to update non existent organizationCache', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        organizationCacheRepository.update(
          randomUUID(),
          { name: 'non-existent' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created organizationCache', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCache = { name: 'test-organizationCache' }

      const returnedorganizationCache = await organizationCacheRepository.create(
        organizationCache,
        mockIRepositoryOptions,
      )

      await organizationCacheRepository.destroy(
        returnedorganizationCache.id,
        mockIRepositoryOptions,
        true,
      )

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        organizationCacheRepository.findById(returnedorganizationCache.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent organizationCache', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        organizationCacheRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
