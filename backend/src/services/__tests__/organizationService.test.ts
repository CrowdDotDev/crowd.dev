import organizationCacheRepository from '../../database/repositories/organizationCacheRepository'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import Plans from '../../security/plans'
import OrganizationService from '../organizationService'

const db = null

const expectedEnriched = {
  identities: [
    {
      name: 'crowd.dev',
      platform: 'crowd',
    },
  ],
  description:
    'Understand, grow, and engage your developer community with zero hassle. With crowd.dev, you can build developer communities that drive your business forward.',
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
  revenueRange: {
    min: 0,
    max: 1,
  },
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
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
          },
        ],
      }

      const added = await service.createOrUpdate(toAdd, false)
      expect(added.identities[0].url).toEqual(null)
    })

    it('Should add without enriching when tenant is not growth', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
          },
        ],
      }

      const added = await service.createOrUpdate(toAdd, true)
      expect(added.identities[0].url).toEqual(null)
    })

    it('Should enrich and add an organization by identity name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
            url: 'https://crowd.dev',
          },
        ],
      }

      const added = await service.createOrUpdate(toAdd)
      expect(added.identities[0].url).toEqual(toAdd.identities[0].url)
      expect(added.identities[0].name).toEqual(toAdd.identities[0].name)
      expect(added.description).toEqual(expectedEnriched.description)
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
      const foundCache = await organizationCacheRepository.findByName(
        'crowd.dev',
        mockIServiceOptions,
      )

      expect(foundCache.url).toEqual('crowd.dev')
      expect(foundCache.name).toEqual(toAdd.identities[0].name)
      expect(foundCache.description).toEqual(expectedEnriched.description)
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

    it('Should not re-enrich when the record is already in the cache table. By Name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )
      const mockIServiceOptions2 = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )

      const service = new OrganizationService(mockIServiceOptions)
      const service2 = new OrganizationService(mockIServiceOptions2)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
            url: 'https://crowd.dev',
          },
        ],
      }

      const added = await service.createOrUpdate(toAdd)
      expect(added.identities[0].url).toEqual(toAdd.identities[0].url)
      expect(added.identities[0].name).toEqual(toAdd.identities[0].name)
      expect(added.description).toEqual(expectedEnriched.description)
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
      const foundCache = await organizationCacheRepository.findByName(
        'crowd.dev',
        mockIServiceOptions,
      )

      expect(foundCache.name).toEqual('crowd.dev')
      expect(foundCache.description).toEqual(expectedEnriched.description)
      expect(foundCache.emails).toEqual(expectedEnriched.emails)
      expect(foundCache.phoneNumbers).toEqual(expectedEnriched.phoneNumbers)
      expect(foundCache.logo).toEqual(expectedEnriched.logo)
      expect(foundCache.tags).toStrictEqual(expectedEnriched.tags)
      expect(foundCache.twitter).toStrictEqual(expectedEnriched.twitter)
      expect(foundCache.linkedin).toStrictEqual(expectedEnriched.linkedin)
      expect(foundCache.crunchbase).toStrictEqual(expectedEnriched.crunchbase)
      expect(foundCache.employees).toEqual(expectedEnriched.employees)
      expect(foundCache.revenueRange).toStrictEqual(expectedEnriched.revenueRange)

      const added2 = await service2.createOrUpdate(toAdd)
      expect(added2.identities[0].url).toEqual(toAdd.identities[0].url)
      expect(added2.description).toEqual(expectedEnriched.description)
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

      const foundCache2 = await organizationCacheRepository.findByName(
        'crowd.dev',
        mockIServiceOptions,
      )
      expect(foundCache2.id).toEqual(foundCache.id)
    })

    it('Should throw an error when name is not sent', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {}

      await expect(service.createOrUpdate(toAdd as any)).rejects.toThrowError(
        'Missing organization identity while creating/updating organization!',
      )
    })

    it('Should not re-create when existing: not enrich and name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
          },
        ],
      }

      await service.createOrUpdate(toAdd)

      const added = await service.createOrUpdate(toAdd)
      expect(added.identities[0].name).toEqual(toAdd.identities[0].name)
      expect(added.identities[0].url).toBeNull()

      const foundAll = await service.findAndCountAll({
        filter: {},
        includeOrganizationsWithoutMembers: true,
      })
      expect(foundAll.count).toBe(1)
    })
  })
})
