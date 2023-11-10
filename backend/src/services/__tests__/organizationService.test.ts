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
    it('Should create organization', async () => {
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

      const added = await service.createOrUpdate(toAdd)
      expect(added.identities[0].url).toEqual(null)
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
