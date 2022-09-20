import organizationCacheRepository from '../../database/repositories/organizationCacheRepository'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import OrganizationService from '../organizationService'

const db = null

const expectedEnriched = {
  url: 'crowd.dev',
  name: 'Crowd.dev',
  description:
    'Understand, grow, and engage your developer community with zero hassle. With crowd.dev, you can build developer communities that drive your business forward.',
  parentUrl: null,
  emails: ['hello@crowd.dev', 'jonathan@crowd.dev', 'careers@crowd.dev'],
  phoneNumbers: ['+42 424242'],
  logo: 'https://logo.clearbit.com/crowd.dev',
  tags: [],
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
    handle: null,
  },
  employees: 5,
  revenueRange: [0, 1],
}

describe('OrganizationService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Create method', () => {
    it('Should add without enriching when enrichP is false', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'crowd.dev',
      }

      const added = await service.findOrCreate(toAdd, false)
      expect(added.url).toEqual(null)
    })

    it('Should add without enriching when tenant is not premium', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'crowd.dev',
      }

      const added = await service.findOrCreate(toAdd, true)
      expect(added.url).toEqual(null)
    })

    it('Should enrich and add an organization by URL', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        url: 'crowd.dev',
      }

      const added = await service.findOrCreate(toAdd)
      expect(added.url).toEqual('crowd.dev')
      expect(added.name).toEqual(expectedEnriched.name)
      expect(added.description).toEqual(expectedEnriched.description)
      expect(added.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(added.emails).toEqual(expectedEnriched.emails)
      expect(added.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(added.logo).toEqual(expectedEnriched.logo)
      expect(added.tags).toStrictEqual(expectedEnriched.tags)
      expect(added.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(added.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(added.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(added.employees).toEqual(expectedEnriched.employees)
      expect(added.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      // Check cache table was created
      const foundCache = await organizationCacheRepository.findByUrl(
        'crowd.dev',
        mockIServiceOptions,
        true,
      )

      expect(foundCache.organizationsSeeded).toStrictEqual([added.id])
      expect(foundCache.url).toEqual('crowd.dev')
      expect(foundCache.name).toEqual(expectedEnriched.name)
      expect(foundCache.description).toEqual(expectedEnriched.description)
      expect(foundCache.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(foundCache.emails).toEqual(expectedEnriched.emails)
      expect(foundCache.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(foundCache.logo).toEqual(expectedEnriched.logo)
      expect(foundCache.tags).toStrictEqual(expectedEnriched.tags)
      expect(foundCache.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(foundCache.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(foundCache.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(foundCache.employees).toEqual(expectedEnriched.employees)
      expect(foundCache.revenueRange).toStrictEqual(expectedEnriched.revenueRange)
    })

    it('Should enrich and add an organization by name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'crowd.dev',
      }

      const added = await service.findOrCreate(toAdd)
      expect(added.url).toEqual('crowd.dev')
      expect(added.name).toEqual(expectedEnriched.name)
      expect(added.description).toEqual(expectedEnriched.description)
      expect(added.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(added.emails).toEqual(expectedEnriched.emails)
      expect(added.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(added.logo).toEqual(expectedEnriched.logo)
      expect(added.tags).toStrictEqual(expectedEnriched.tags)
      expect(added.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(added.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(added.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(added.employees).toEqual(expectedEnriched.employees)
      expect(added.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      // Check cache table was created
      const foundCache = await organizationCacheRepository.findByUrl(
        'crowd.dev',
        mockIServiceOptions,
        true,
      )

      expect(foundCache.organizationsSeeded).toStrictEqual([added.id])
      expect(foundCache.url).toEqual('crowd.dev')
      expect(foundCache.name).toEqual(expectedEnriched.name)
      expect(foundCache.description).toEqual(expectedEnriched.description)
      expect(foundCache.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(foundCache.emails).toEqual(expectedEnriched.emails)
      expect(foundCache.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(foundCache.logo).toEqual(expectedEnriched.logo)
      expect(foundCache.tags).toStrictEqual(expectedEnriched.tags)
      expect(foundCache.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(foundCache.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(foundCache.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(foundCache.employees).toEqual(expectedEnriched.employees)
      expect(foundCache.revenueRange).toStrictEqual(expectedEnriched.revenueRange)
    })

    it('Should not re-enrich when the record is already in the cache table. By URL', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const mockIServiceOptions2 = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')

      const service = new OrganizationService(mockIServiceOptions)
      const service2 = new OrganizationService(mockIServiceOptions2)

      const toAdd = {
        url: 'https://crowd.dev',
      }

      const added = await service.findOrCreate(toAdd)
      expect(added.url).toEqual('crowd.dev')
      expect(added.name).toEqual(expectedEnriched.name)
      expect(added.description).toEqual(expectedEnriched.description)
      expect(added.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(added.emails).toEqual(expectedEnriched.emails)
      expect(added.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(added.logo).toEqual(expectedEnriched.logo)
      expect(added.tags).toStrictEqual(expectedEnriched.tags)
      expect(added.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(added.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(added.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(added.employees).toEqual(expectedEnriched.employees)
      expect(added.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      // Check cache table was created
      const foundCache = await organizationCacheRepository.findByUrl(
        'crowd.dev',
        mockIServiceOptions,
        true,
      )

      expect(foundCache.organizationsSeeded).toStrictEqual([added.id])
      expect(foundCache.url).toEqual('crowd.dev')
      expect(foundCache.name).toEqual(expectedEnriched.name)
      expect(foundCache.description).toEqual(expectedEnriched.description)
      expect(foundCache.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(foundCache.emails).toEqual(expectedEnriched.emails)
      expect(foundCache.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(foundCache.logo).toEqual(expectedEnriched.logo)
      expect(foundCache.tags).toStrictEqual(expectedEnriched.tags)
      expect(foundCache.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(foundCache.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(foundCache.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(foundCache.employees).toEqual(expectedEnriched.employees)
      expect(foundCache.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      const added2 = await service2.findOrCreate(toAdd)
      expect(added2.url).toEqual('crowd.dev')
      expect(added2.name).toEqual(expectedEnriched.name)
      expect(added2.description).toEqual(expectedEnriched.description)
      expect(added2.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(added2.emails).toEqual(expectedEnriched.emails)
      expect(added2.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(added2.logo).toEqual(expectedEnriched.logo)
      expect(added2.tags).toStrictEqual(expectedEnriched.tags)
      expect(added2.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(added2.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(added2.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(added2.employees).toEqual(expectedEnriched.employees)
      expect(added2.revenueRange).toStrictEqual(expectedEnriched.revenueRange)
      // Check they are indeed in different tenants
      expect(added2.tenantId).not.toBe(added.tenantId)

      const foundCache2 = await organizationCacheRepository.findByUrl(
        'crowd.dev',
        mockIServiceOptions,
        true,
      )
      expect(foundCache2.organizationsSeeded).toStrictEqual([added.id, added2.id])
      expect(foundCache2.id).toEqual(foundCache.id)
    })

    it('Should throw an error when name and URL are not sent', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {}

      await expect(service.findOrCreate(toAdd)).rejects.toThrowError(
        'Organization Name or Url is required',
      )
    })

    it('Should not re-create when existing: enrich and url', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        url: 'crowd.dev',
      }

      await service.findOrCreate(toAdd)

      const added = await service.findOrCreate(toAdd)
      expect(added.url).toEqual('crowd.dev')
      expect(added.name).toEqual(expectedEnriched.name)
      expect(added.description).toEqual(expectedEnriched.description)
      expect(added.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(added.emails).toEqual(expectedEnriched.emails)
      expect(added.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(added.logo).toEqual(expectedEnriched.logo)
      expect(added.tags).toStrictEqual(expectedEnriched.tags)
      expect(added.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(added.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(added.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(added.employees).toEqual(expectedEnriched.employees)
      expect(added.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      const foundAll = await service.findAndCountAll({ filter: {} })
      expect(foundAll.count).toBe(1)
    })

    it('Should not re-create when existing: not enrich and name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'crowd.dev',
      }

      await service.findOrCreate(toAdd)

      const added = await service.findOrCreate(toAdd)
      expect(added.name).toEqual(toAdd.name)
      expect(added.url).toBeNull()

      const foundAll = await service.findAndCountAll({ filter: {} })
      expect(foundAll.count).toBe(1)
    })

    it('Should not re-create when existing: enrich and name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, 'premium')
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'crowd.dev',
      }

      await service.findOrCreate(toAdd)

      const added = await service.findOrCreate(toAdd)
      expect(added.url).toEqual('crowd.dev')
      expect(added.name).toEqual(expectedEnriched.name)
      expect(added.description).toEqual(expectedEnriched.description)
      expect(added.parentUrl).toEqual(expectedEnriched.parentUrl)
      expect(added.emails).toEqual(expectedEnriched.emails)
      expect(added.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(added.logo).toEqual(expectedEnriched.logo)
      expect(added.tags).toStrictEqual(expectedEnriched.tags)
      expect(added.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(added.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(added.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(added.employees).toEqual(expectedEnriched.employees)
      expect(added.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      const foundAll = await service.findAndCountAll({ filter: {} })
      expect(foundAll.count).toBe(1)
    })
  })
})
