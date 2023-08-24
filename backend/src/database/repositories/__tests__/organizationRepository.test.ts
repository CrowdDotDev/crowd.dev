import moment from 'moment'
import OrganizationRepository from '../organizationRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import MemberRepository from '../memberRepository'
import { PlatformType } from '@crowd/types'
import ActivityRepository from '../activityRepository'
import { generateUUIDv1 } from '@crowd/common'

const db = null

const toCreate = {
  name: 'crowd.dev',
  displayName: 'crowd.dev',
  url: 'https://crowd.dev',
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
  inferredRevenue: null,
  recentExecutiveDepartures: null,
  recentExecutiveHires: null,
  ultimateParent: null,
  immediateParent: null,
}

async function createMembers(options) {
  return [
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
    it('Should create the given organization succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationCreated = {
        id: organizationCreated.id,
        ...toCreate,
        github: null,
        location: null,
        website: null,
        memberCount: 0,
        activityCount: 0,
        activeOn: [],
        identities: [],
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

    it('Should create an organization with members succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberIds = await createMembers(mockIRepositoryOptions)

      const toCreateWithMember = {
        ...toCreate,
        members: memberIds,
      }
      const organizationCreated = await OrganizationRepository.create(
        toCreateWithMember,
        mockIRepositoryOptions,
      )
      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationCreated = {
        id: organizationCreated.id,
        ...toCreate,
        memberCount: 2,
        activityCount: 0,
        github: null,
        location: null,
        website: null,
        lastActive: null,
        joinedAt: null,
        activeOn: [],
        identities: ['github'],
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
      }
      expect(organizationCreated).toStrictEqual(expectedOrganizationCreated)

      const member1 = await MemberRepository.findById(memberIds[0], mockIRepositoryOptions)
      const member2 = await MemberRepository.findById(memberIds[1], mockIRepositoryOptions)
      expect(member1.organizations[0].url).toStrictEqual(organizationCreated.url)
      expect(member2.organizations[0].url).toStrictEqual(organizationCreated.url)
    })
  })

  describe('findById method', () => {
    it('Should successfully find created organization by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationFound = {
        id: organizationCreated.id,
        ...toCreate,
        github: null,
        location: null,
        website: null,
        memberCount: 0,
        activityCount: 0,
        activeOn: [],
        identities: [],
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
      }
      const organizationById = await OrganizationRepository.findById(
        organizationCreated.id,
        mockIRepositoryOptions,
      )

      organizationById.createdAt = organizationById.createdAt.toISOString().split('T')[0]
      organizationById.updatedAt = organizationById.updatedAt.toISOString().split('T')[0]

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

  describe('findByUrl/name methods', () => {
    it('Should successfully find created organization by name', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationFound = {
        id: organizationCreated.id,
        ...toCreate,
        github: null,
        location: null,
        website: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        isTeamOrganization: false,
        attributes: {},
      }
      const organizatioFound = await OrganizationRepository.findByName(
        organizationCreated.name,
        mockIRepositoryOptions,
      )

      organizatioFound.createdAt = organizatioFound.createdAt.toISOString().split('T')[0]
      organizatioFound.updatedAt = organizatioFound.updatedAt.toISOString().split('T')[0]

      expect(organizatioFound).toStrictEqual(expectedOrganizationFound)
    })

    it('Should successfully find created organization by url', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationFound = {
        id: organizationCreated.id,
        ...toCreate,
        github: null,
        location: null,
        website: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        isTeamOrganization: false,
        attributes: {},
      }
      const organizatioFound = await OrganizationRepository.findByUrl(
        organizationCreated.url,
        mockIRepositoryOptions,
      )

      organizatioFound.createdAt = organizatioFound.createdAt.toISOString().split('T')[0]
      organizatioFound.updatedAt = organizatioFound.updatedAt.toISOString().split('T')[0]

      expect(organizatioFound).toStrictEqual(expectedOrganizationFound)
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created organization entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization1 = { name: 'test1' }
      const organization2 = { name: 'test2' }

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

      const organization = { name: 'test1' }

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

      const organization = { name: 'test' }

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

  describe('findAndCountAll method', () => {
    it('Should find and count all organizations, with simple filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization1 = { name: 'test-organization' }
      const organization2 = { name: 'test-organization-2' }
      const organization3 = { name: 'another-organization' }

      const organization1Created = await OrganizationRepository.create(
        organization1,
        mockIRepositoryOptions,
      )
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const organization2Created = await OrganizationRepository.create(
        organization2,
        mockIRepositoryOptions,
      )
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const organization3Created = await OrganizationRepository.create(
        organization3,
        mockIRepositoryOptions,
      )

      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test-member',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          joinedAt: moment().toDate(),
          organizations: [
            organization1Created.id,
            organization2Created.id,
            organization3Created.id,
          ],
        },
        mockIRepositoryOptions,
      )

      const foundOrganization1 = await OrganizationRepository.findById(
        organization1Created.id,
        mockIRepositoryOptions,
      )

      const foundOrganization2 = await OrganizationRepository.findById(
        organization2Created.id,
        mockIRepositoryOptions,
      )

      const foundOrganization3 = await OrganizationRepository.findById(
        organization3Created.id,
        mockIRepositoryOptions,
      )

      // Test filter by name
      // Current findAndCountAll uses wildcarded like statement so it matches both organizations
      let organizations
      try {
        organizations = await OrganizationRepository.findAndCountAll(
          { filter: { name: 'test-organization' } },
          mockIRepositoryOptions,
        )
      } catch (err) {
        console.error(err)
        throw err
      }

      expect(organizations.count).toEqual(2)
      expect(organizations.rows).toEqual([foundOrganization2, foundOrganization1])

      // Test filter by id
      organizations = await OrganizationRepository.findAndCountAll(
        { filter: { id: organization1Created.id } },
        mockIRepositoryOptions,
      )

      expect(organizations.count).toEqual(1)
      expect(organizations.rows).toStrictEqual([foundOrganization1])

      // Test filter by createdAt - find all between organization1.createdAt and organization3.createdAt
      organizations = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [organization1Created.createdAt, organization3Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )

      expect(organizations.count).toEqual(3)
      expect(organizations.rows).toStrictEqual([
        foundOrganization3,
        foundOrganization2,
        foundOrganization1,
      ])

      // Test filter by createdAt - find all where createdAt < organization2.createdAt
      organizations = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, organization2Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(organizations.count).toEqual(2)
      expect(organizations.rows).toStrictEqual([foundOrganization2, foundOrganization1])

      // Test filter by createdAt - find all where createdAt < organization1.createdAt
      organizations = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, organization1Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(organizations.count).toEqual(1)
      expect(organizations.rows).toStrictEqual([foundOrganization1])
    })
  })

  describe('filter method', () => {
    const crowddev = {
      name: 'crowd.dev',
      url: 'https://crowd.dev',
      description: 'Community-led Growth for Developer-first Companies.\nJoin our private beta',
      emails: ['hello@crowd.dev', 'jonathan@crowd.dev'],
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
    }

    const piedpiper = {
      name: 'Pied Piper',
      url: 'https://piedpiper.io',
      description: 'Pied Piper is a fictional technology company in the HBO television series',
      emails: ['richard@piedpiper.io', 'jarded@pipedpiper.io'],
      phoneNumbers: ['+42 54545454'],
      logo: 'https://logo.clearbit.com/piedpiper',
      tags: ['new-internet', 'compression'],
      twitter: {
        handle: 'piedPiper',
        id: '1362101830923259908',
        bio: 'Pied Piper is a making the new, decentralized internet',
        followers: 1024,
        following: 0,
        location: 'silicon valley',
        site: 'https://t.co/GRLDhqFWk4',
        avatar: 'https://pbs.twimg.com/profile_images/1419741008716251141/6exZe94-_normal.jpg',
      },
      linkedin: {
        handle: 'company/piedpiper',
      },
      crunchbase: {
        handle: 'company/piedpiper',
      },
      employees: 100,
      revenueRange: {
        min: 0,
        max: 1,
      },
    }

    const hooli = {
      name: 'Hooli',
      url: 'https://hooli.com',
      description: 'Hooli is a fictional technology company in the HBO television series',
      emails: ['gavin@hooli.com'],
      phoneNumbers: ['+42 12121212'],
      logo: 'https://logo.clearbit.com/hooli',
      tags: ['not-google', 'elephant'],
      twitter: {
        handle: 'hooli',
        id: '1362101830923259908',
        bio: 'Hooli is making the world a better place',
        followers: 1000000,
        following: 0,
        location: 'silicon valley',
        site: 'https://t.co/GRLDhqFWk4',
        avatar: 'https://pbs.twimg.com/profile_images/1419741008716251141/6exZe94-_normal.jpg',
      },
      linkedin: {
        handle: 'company/hooli',
      },
      crunchbase: {
        handle: 'company/hooli',
      },
      employees: 10000,
      revenueRange: {
        min: 200,
        max: 500,
      },
    }

    it('Should filter by name', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            name: 'Pied Piper',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toEqual('Pied Piper')
    })

    it('Should filter by url', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            url: 'crowd.dev',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('crowd.dev')
    })

    it('Should filter by description', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            description: 'community',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('crowd.dev')
    })

    it('Should filter by emails', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            emails: 'richard@piedpiper.io,jonathan@crowd.dev',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(2)

      const found2 = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            emails: ['richard@piedpiper.io', 'jonathan@crowd.dev'],
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found2.count).toEqual(2)
    })

    it('Should filter by tags', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            tags: 'new-internet,not-google,new',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(2)

      const found2 = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            tags: ['new-internet', 'not-google', 'new'],
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found2.count).toEqual(2)
    })

    it('Should filter by twitter handle', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            twitter: 'crowdDotDev',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('crowd.dev')
    })

    it('Should filter by linkedin handle', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            linkedin: 'crowddevhq',
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('crowd.dev')
    })

    it('Should filter by employee range', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            employeesRange: [90, 120],
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('Pied Piper')
    })

    it('Should filter by revenue range', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions)
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            revenueMin: 0,
            revenueMax: 1,
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('Pied Piper')

      const found2 = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            revenueMin: 9,
          },
          includeOrganizationsWithoutMembers: true,
        },
        mockIRepositoryOptions,
      )

      expect(found2.count).toEqual(2)
    })

    it('Should filter by members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: {
            github: {
              username: 'joan',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
          activities: [
            {
              username: 'joan',
              type: 'activity',
              timestamp: '2020-05-27T15:13:30Z',
              platform: PlatformType.GITHUB,
              sourceId: '#sourceId1',
            },
          ],
        },
      ])
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const memberId = await (
        await MemberRepository.findAndCountAll({}, mockIRepositoryOptions)
      ).rows[0].id

      const found = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            members: [memberId],
          },
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(1)
      expect(found.rows[0].name).toBe('crowd.dev')
    })

    it('Should filter by memberCount', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const org1 = await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: {
            github: {
              username: 'joan',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
        },
        {
          username: {
            github: {
              username: 'anil',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'anil',
          joinedAt: moment().toDate(),
        },
        {
          username: {
            github: {
              username: 'uros',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'uros',
          joinedAt: moment().toDate(),
        },
      ])
      const org2 = await createOrganization(piedpiper, mockIRepositoryOptions, [
        {
          username: {
            github: {
              username: 'mario',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'mario',
          joinedAt: moment().toDate(),
        },
        {
          username: {
            github: {
              username: 'igor',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'igor',
          joinedAt: moment().toDate(),
        },
      ])
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          advancedFilter: {
            memberCount: {
              gte: 2,
            },
          },
        },
        mockIRepositoryOptions,
      )

      delete org1.members
      delete org2.members

      expect(found.count).toBe(2)
      expect(found.rows.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))).toStrictEqual([
        org1,
        org2,
      ])
    })

    it('Should work with advanced filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: {
            github: {
              username: 'joan',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
        },
      ])
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const memberId = await (
        await MemberRepository.findAndCountAll({}, mockIRepositoryOptions)
      ).rows[0].id

      // Revenue nested field
      expect(
        (
          await OrganizationRepository.findAndCountAll(
            {
              advancedFilter: {
                revenue: {
                  gte: 9,
                },
              },
              includeOrganizationsWithoutMembers: true,
            },
            mockIRepositoryOptions,
          )
        ).count,
      ).toEqual(2)

      // Twitter bio
      expect(
        (
          await OrganizationRepository.findAndCountAll(
            {
              advancedFilter: {
                'twitter.bio': {
                  textContains: 'world a better place',
                },
              },
              includeOrganizationsWithoutMembers: true,
            },
            mockIRepositoryOptions,
          )
        ).count,
      ).toEqual(1)

      expect(
        (
          await OrganizationRepository.findAndCountAll(
            {
              advancedFilter: {
                or: [
                  {
                    and: [
                      {
                        revenue: {
                          gte: 9,
                        },
                      },
                      {
                        revenue: {
                          lte: 100,
                        },
                      },
                    ],
                  },
                  {
                    'twitter.bio': {
                      textContains: 'world a better place',
                    },
                  },
                ],
              },
              includeOrganizationsWithoutMembers: true,
            },
            mockIRepositoryOptions,
          )
        ).count,
      ).toEqual(2)

      expect(
        (
          await OrganizationRepository.findAndCountAll(
            {
              advancedFilter: {
                or: [
                  {
                    and: [
                      {
                        tags: {
                          overlap: ['not-google'],
                        },
                      },
                      {
                        'twitter.location': {
                          textContains: 'silicon valley',
                        },
                      },
                    ],
                  },
                  {
                    members: [memberId],
                  },
                ],
              },
              includeOrganizationsWithoutMembers: true,
            },
            mockIRepositoryOptions,
          )
        ).count,
      ).toEqual(2)
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      const organizationUpdated = await OrganizationRepository.update(
        organizationCreated.id,
        { name: 'updated-organization-name' },
        mockIRepositoryOptions,
      )

      expect(organizationUpdated.updatedAt.getTime()).toBeGreaterThan(
        organizationUpdated.createdAt.getTime(),
      )

      const organizationExpected = {
        id: organizationCreated.id,
        ...toCreate,
        github: null,
        location: null,
        website: null,
        memberCount: 0,
        activityCount: 0,
        activeOn: [],
        identities: [],
        lastActive: null,
        joinedAt: null,
        name: organizationUpdated.name,
        importHash: null,
        createdAt: organizationCreated.createdAt,
        updatedAt: organizationUpdated.updatedAt,
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        isTeamOrganization: false,
        attributes: {},
      }

      expect(organizationUpdated).toStrictEqual(organizationExpected)
    })

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

  describe('setOrganizationIsTeam method', () => {
    const member1 = {
      username: {
        devto: {
          username: 'iambarker',
          integrationId: generateUUIDv1(),
        },
        github: {
          username: 'barker',
          integrationId: generateUUIDv1(),
        },
      },
      displayName: 'Jack Barker',
      attributes: {
        bio: {
          github: 'Head of development at Hooli',
          twitter: 'Head of development at Hooli | ex CEO at Pied Piper',
        },
        sample: { crowd: true, default: true },
        jobTitle: { custom: 'Head of development', default: 'Head of development' },
        location: { github: 'Silicon Valley', default: 'Silicon Valley' },
        avatarUrl: {
          custom:
            'https://s3.eu-central-1.amazonaws.com/crowd.dev-sample-data/jack-barker-best.jpg',
          default:
            'https://s3.eu-central-1.amazonaws.com/crowd.dev-sample-data/jack-barker-best.jpg',
        },
      },
      joinedAt: moment().toDate(),
      activities: [
        {
          type: 'star',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          username: 'barker',
          sourceId: '#sourceId1',
        },
      ],
    }

    const member2 = {
      username: {
        devto: {
          username: 'thebelson',
          integrationId: generateUUIDv1(),
        },
        github: {
          username: 'gavinbelson',
          integrationId: generateUUIDv1(),
        },
        discord: {
          username: 'gavinbelson',
          integrationId: generateUUIDv1(),
        },
        twitter: {
          username: 'gavin',
          integrationId: generateUUIDv1(),
        },
        linkedin: {
          username: 'gavinbelson',
          integrationId: generateUUIDv1(),
        },
      },
      displayName: 'Gavin Belson',
      attributes: {
        bio: {
          custom: 'CEO at Hooli',
          github: 'CEO at Hooli',
          default: 'CEO at Hooli',
          twitter: 'CEO at Hooli',
        },
        sample: { crowd: true, default: true },
        jobTitle: { custom: 'CEO', default: 'CEO' },
        location: { github: 'Silicon Valley', default: 'Silicon Valley' },
        avatarUrl: {
          custom: 'https://s3.eu-central-1.amazonaws.com/crowd.dev-sample-data/gavin.jpg',
          default: 'https://s3.eu-central-1.amazonaws.com/crowd.dev-sample-data/gavin.jpg',
        },
      },
      joinedAt: moment().toDate(),
      activities: [
        {
          type: 'star',
          timestamp: '2020-05-28T15:13:30Z',
          username: 'gavinbelson',
          platform: PlatformType.GITHUB,
          sourceId: '#sourceId2',
        },
      ],
    }

    const member3 = {
      username: {
        devto: {
          username: 'bigheader',
          integrationId: generateUUIDv1(),
        },
        github: {
          username: 'bighead',
          integrationId: generateUUIDv1(),
        },
      },
      displayName: 'Big Head',
      attributes: {
        bio: {
          custom: 'Executive at the Hooli XYZ project',
          github: 'Co-head Dreamer of the Hooli XYZ project',
          default: 'Executive at the Hooli XYZ project',
          twitter: 'Co-head Dreamer of the Hooli XYZ project',
        },
        sample: { crowd: true, default: true },
        jobTitle: { custom: 'Co-head Dreamer', default: 'Co-head Dreamer' },
        location: { github: 'Silicon Valley', default: 'Silicon Valley' },
        avatarUrl: {
          custom: 'https://s3.eu-central-1.amazonaws.com/crowd.dev-sample-data/big-head-small.jpg',
          default: 'https://s3.eu-central-1.amazonaws.com/crowd.dev-sample-data/big-head-small.jpg',
        },
      },
      joinedAt: moment().toDate(),
      activities: [
        {
          type: 'star',
          timestamp: '2020-05-29T15:13:30Z',
          platform: PlatformType.GITHUB,
          username: 'bighead',
          sourceId: '#sourceId3',
        },
      ],
    }
    it('Should succesfully set/unset organization members as team members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const org = await createOrganization(toCreate, mockIRepositoryOptions, [
        member1,
        member2,
        member3,
      ])

      // mark organization members as team members
      await OrganizationRepository.setOrganizationIsTeam(org.id, true, mockIRepositoryOptions)

      let m1 = await MemberRepository.findById(org.members[0], mockIRepositoryOptions)
      let m2 = await MemberRepository.findById(org.members[1], mockIRepositoryOptions)
      let m3 = await MemberRepository.findById(org.members[2], mockIRepositoryOptions)

      expect(m1.attributes.isTeamMember.default).toEqual(true)
      expect(m2.attributes.isTeamMember.default).toEqual(true)
      expect(m3.attributes.isTeamMember.default).toEqual(true)

      // expect other attributes intact
      delete m1.attributes.isTeamMember
      expect(m1.attributes).toStrictEqual(member1.attributes)

      delete m2.attributes.isTeamMember
      expect(m2.attributes).toStrictEqual(member2.attributes)

      delete m3.attributes.isTeamMember
      expect(m3.attributes).toStrictEqual(member3.attributes)

      // now unmark
      await OrganizationRepository.setOrganizationIsTeam(org.id, false, mockIRepositoryOptions)

      m1 = await MemberRepository.findById(org.members[0], mockIRepositoryOptions)
      m2 = await MemberRepository.findById(org.members[1], mockIRepositoryOptions)
      m3 = await MemberRepository.findById(org.members[2], mockIRepositoryOptions)

      expect(m1.attributes.isTeamMember.default).toEqual(false)
      expect(m2.attributes.isTeamMember.default).toEqual(false)
      expect(m3.attributes.isTeamMember.default).toEqual(false)

      // expect other attributes intact
      delete m1.attributes.isTeamMember
      expect(m1.attributes).toStrictEqual(member1.attributes)

      delete m2.attributes.isTeamMember
      expect(m2.attributes).toStrictEqual(member2.attributes)

      delete m3.attributes.isTeamMember
      expect(m3.attributes).toStrictEqual(member3.attributes)
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = { name: 'test-organization' }

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
