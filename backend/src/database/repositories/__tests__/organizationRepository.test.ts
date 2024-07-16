import moment from 'moment'
import { generateUUIDv1, Error404 } from '@crowd/common'
import { PlatformType } from '@crowd/types'
import OrganizationRepository from '../organizationRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import MemberRepository from '../memberRepository'
import ActivityRepository from '../activityRepository'

const db = null

const toCreate = {
  identities: [
    {
      name: 'crowd.dev',
      platform: 'crowd',
      url: 'https://crowd.dev',
    },
  ],
  displayName: 'crowd.dev',
  description: 'Community-led Growth for Developer-first Companies.\nJoin our private beta',
  emails: ['hello@crowd.dev', 'jonathan@crow.dev'],
  phoneNumbers: ['+42 424242424'],
  logo: 'https://logo.clearbit.com/crowd.dev',
  tags: ['community', 'growth', 'developer-first'],
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
  profiles: null,
  manuallyCreated: false,
  affiliatedProfiles: null,
  allSubsidiaries: null,
  alternativeDomains: null,
  alternativeNames: null,
  averageEmployeeTenure: null,
  averageTenureByLevel: null,
  averageTenureByRole: null,
  directSubsidiaries: null,
  employeeChurnRate: null,
  employeeCountByMonth: null,
  employeeGrowthRate: null,
  employeeCountByMonthByLevel: null,
  employeeCountByMonthByRole: null,
  gicsSector: null,
  grossAdditionsByMonth: null,
  grossDeparturesByMonth: null,
  ultimateParent: null,
  immediateParent: null,
}

async function createMembers(options) {
  return await [
    (
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'gilfoyle',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        options,
      )
    ).id,
    (
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'dinesh',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          joinedAt: '2020-06-27T15:13:30Z',
        },
        options,
      )
    ).id,
  ]
}

async function createActivitiesForMembers(memberIds: string[], organizationId: string, options) {
  for (const memberId of memberIds) {
    await ActivityRepository.create(
      {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        attributes: {
          replies: 12,
        },
        title: 'Title',
        body: 'Here',
        url: 'https://github.com',
        channel: 'channel',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 98,
        },
        isContribution: true,
        username: 'test',
        member: memberId,
        organizationId,
        score: 1,
        sourceId: '#sourceId:' + memberId,
      },
      options,
    )
  }
}

async function createOrganization(organization: any, options, members = []) {
  const memberIds = []
  for (const member of members) {
    const memberCreated = await MemberRepository.create(
      SequelizeTestUtils.objectWithoutKey(member, 'activities'),
      options,
    )

    if (member.activities) {
      for (const activity of member.activities) {
        await ActivityRepository.create({ ...activity, member: memberCreated.id }, options)
      }
    }

    memberIds.push(memberCreated.id)
  }
  organization.members = memberIds
  const organizationCreated = await OrganizationRepository.create(organization, options)
  return { ...organizationCreated, members: memberIds }
}

describe('OrganizationRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it.skip('Should create the given organization succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      delete organizationCreated.identities[0].createdAt
      delete organizationCreated.identities[0].updatedAt

      const primaryIdentity = toCreate.identities[0]

      const expectedOrganizationCreated = {
        id: organizationCreated.id,
        ...toCreate,
        github: null,
        location: null,
        website: null,
        memberCount: 0,
        activityCount: 0,
        activeOn: [],
        identities: [
          {
            integrationId: null,
            name: primaryIdentity.name,
            organizationId: organizationCreated.id,
            platform: primaryIdentity.platform,
            url: primaryIdentity.url,
            sourceId: null,
            tenantId: mockIRepositoryOptions.currentTenant.id,
          },
        ],
        importHash: null,
        lastActive: null,
        joinedAt: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        isTeamOrganization: false,
        attributes: {},
        weakIdentities: [],
        manuallyChangedFields: null,
      }
      expect(organizationCreated).toStrictEqual(expectedOrganizationCreated)
    })

    it('Should throw sequelize not null error -- name field is required', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization2add = {}

      await expect(() =>
        OrganizationRepository.create(organization2add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it.skip('Should successfully find created organization by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const primaryIdentity = toCreate.identities[0]

      const expectedOrganizationFound = {
        id: organizationCreated.id,
        ...toCreate,
        identities: [
          {
            integrationId: null,
            name: primaryIdentity.name,
            organizationId: organizationCreated.id,
            platform: primaryIdentity.platform,
            url: primaryIdentity.url,
            sourceId: null,
            tenantId: mockIRepositoryOptions.currentTenant.id,
          },
        ],
        github: null,
        location: null,
        website: null,
        memberCount: 0,
        activityCount: 0,
        activeOn: [],
        lastActive: null,
        joinedAt: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        isTeamOrganization: false,
        attributes: {},
        weakIdentities: [],
        manuallyChangedFields: null,
      }
      const organizationById = await OrganizationRepository.findById(
        organizationCreated.id,
        mockIRepositoryOptions,
      )

      organizationById.createdAt = organizationById.createdAt.toISOString().split('T')[0]
      organizationById.updatedAt = organizationById.updatedAt.toISOString().split('T')[0]

      delete organizationById.identities[0].createdAt
      delete organizationById.identities[0].updatedAt

      expect(organizationById).toStrictEqual(expectedOrganizationFound)
    })

    it('Should throw 404 error when no organization found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        OrganizationRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created organization entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization1 = {
        identities: [{ name: 'test1', platform: 'crowd' }],
        displayName: 'test1',
      }
      const organization2 = {
        identities: [{ name: 'test2', platform: 'crowd' }],
        displayName: 'test2',
      }

      const organization1Created = await OrganizationRepository.create(
        organization1,
        mockIRepositoryOptions,
      )
      const organization2Created = await OrganizationRepository.create(
        organization2,
        mockIRepositoryOptions,
      )

      const filterIdsReturned = await OrganizationRepository.filterIdsInTenant(
        [organization1Created.id, organization2Created.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([organization1Created.id, organization2Created.id])
    })

    it('Should only return the ids of previously created organizations and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = {
        identities: [{ name: 'test1', platform: 'crowd' }],
        displayName: 'test1',
      }

      const organizationCreated = await OrganizationRepository.create(
        organization,
        mockIRepositoryOptions,
      )

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await OrganizationRepository.filterIdsInTenant(
        [organizationCreated.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([organizationCreated.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = {
        identities: [{ name: 'test1', platform: 'crowd' }],
        displayName: 'test1',
      }

      const organizationCreated = await OrganizationRepository.create(
        organization,
        mockIRepositoryOptions,
      )

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await OrganizationRepository.filterIdsInTenant(
        [organizationCreated.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('update method', () => {
    it('Should throw 404 error when trying to update non existent organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        OrganizationRepository.update(
          randomUUID(),
          { name: 'non-existent' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = { displayName: 'test-organization' }

      const returnedOrganization = await OrganizationRepository.create(
        organization,
        mockIRepositoryOptions,
      )

      await OrganizationRepository.destroy(returnedOrganization.id, mockIRepositoryOptions, true)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        OrganizationRepository.findById(returnedOrganization.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        OrganizationRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
