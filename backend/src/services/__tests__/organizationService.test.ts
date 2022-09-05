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
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'crowd.dev',
      }

      const added = await service.create(toAdd, false)
      expect(added.url).toEqual(null)
    })
    it('Should enrich and add an organization by URL', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        url: 'crowd.dev',
      }

      const added = await service.create(toAdd)
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
    })

    it('Should enrich and add an organization by name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        name: 'rasa',
      }

      const added = await service.create(toAdd)
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
    })

    it('Should throw an error when name and URL are not sent', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {}

      await expect(service.create(toAdd)).rejects.toThrowError(
        'Organization Name or Url is required',
      )
    })
  })
})
