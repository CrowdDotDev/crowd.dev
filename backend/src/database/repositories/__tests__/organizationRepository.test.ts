import moment from 'moment'
import OrganizationRepository from '../organizationRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import MemberRepository from '../memberRepository'
import { PlatformType } from '../../../types/integrationEnums'
import ActivityRepository from '../activityRepository'

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

async function createMembers(options) {
  return [
    (
      await MemberRepository.create(
        {
          username: { [PlatformType.GITHUB]: 'gilfoyle' },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        options,
      )
    ).id,
    (
      await MemberRepository.create(
        {
          username: { [PlatformType.GITHUB]: 'dinesh' },
          displayName: 'Member 2',
          joinedAt: '2020-06-27T15:13:30Z',
        },
        options,
      )
    ).id,
  ]
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
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
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
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
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
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
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
          username: { [PlatformType.GITHUB]: 'test-member' },
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
      let organizations = await OrganizationRepository.findAndCountAll(
        { filter: { name: 'test-organization' } },
        mockIRepositoryOptions,
      )

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
      parentUrl: null,
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
      parentUrl: null,
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
      parentUrl: null,
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
      return OrganizationRepository.create(organization, options)
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
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(2)

      const found2 = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            emails: ['richard@piedpiper.io', 'jonathan@crowd.dev'],
          },
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
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toEqual(2)

      const found2 = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            tags: ['new-internet', 'not-google', 'new'],
          },
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
        },
        mockIRepositoryOptions,
      )

      expect(found2.count).toEqual(2)
    })

    it('Should filter by members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: { github: 'joan' },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
          activities: [
            {
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

    it('Should filter by activityCount', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const org1 = await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: { github: 'joan' },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2020-05-27T15:13:30Z',
              platform: PlatformType.GITHUB,
              sourceId: '#sourceId1',
            },
          ],
        },
        {
          username: { github: 'anil' },
          displayName: 'anil',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2020-06-27T15:13:30Z',
              platform: PlatformType.TWITTER,
              sourceId: '#sourceId2',
            },
          ],
        },
      ])
      await createOrganization(piedpiper, mockIRepositoryOptions)
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          advancedFilter: {
            activityCount: {
              gte: 2,
            },
          },
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toBe(1)
      expect(found.rows).toStrictEqual([org1])
    })

    it('Should filter by memberCount', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const org1 = await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: { github: 'joan' },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
        },
        {
          username: { github: 'anil' },
          displayName: 'anil',
          joinedAt: moment().toDate(),
        },
        {
          username: { github: 'uros' },
          displayName: 'uros',
          joinedAt: moment().toDate(),
        },
      ])
      const org2 = await createOrganization(piedpiper, mockIRepositoryOptions, [
        {
          username: { github: 'mario' },
          displayName: 'mario',
          joinedAt: moment().toDate(),
        },
        {
          username: { github: 'igor' },
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

      expect(found.count).toBe(2)
      expect(found.rows.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))).toStrictEqual([
        org1,
        org2,
      ])
    })

    it('Should filter by joinedAt', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: { github: 'joan' },
          displayName: 'Joan',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2020-05-27T15:13:30Z',
              platform: PlatformType.GITHUB,
              sourceId: '#sourceId1',
            },
          ],
        },
        {
          username: { github: 'anil' },
          displayName: 'anil',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2020-04-27T15:13:30Z',
              platform: PlatformType.SLACK,
              sourceId: '#sourceId2',
            },
          ],
        },
        {
          username: { github: 'uros' },
          displayName: 'uros',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2020-03-27T15:13:30Z',
              platform: PlatformType.TWITTER,
              sourceId: '#sourceId3',
            },
          ],
        },
      ])
      const org2 = await createOrganization(piedpiper, mockIRepositoryOptions, [
        {
          username: { github: 'mario' },
          displayName: 'mario',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2022-03-27T15:13:30Z',
              platform: PlatformType.DEVTO,
              sourceId: '#sourceId4',
            },
          ],
        },
        {
          username: { github: 'igor' },
          displayName: 'igor',
          joinedAt: moment().toDate(),
          activities: [
            {
              type: 'activity',
              timestamp: '2022-02-27T15:13:30Z',
              platform: PlatformType.DEVTO,
              sourceId: '#sourceId4',
            },
          ],
        },
      ])
      await createOrganization(hooli, mockIRepositoryOptions)

      const found = await OrganizationRepository.findAndCountAll(
        {
          advancedFilter: {
            joinedAt: {
              gte: '2022-02-27',
            },
          },
        },
        mockIRepositoryOptions,
      )

      expect(found.count).toBe(1)
      expect(found.rows.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))).toStrictEqual([org2])
    })

    it('Should work with advanced filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await createOrganization(crowddev, mockIRepositoryOptions, [
        {
          username: { github: 'joan' },
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
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
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
