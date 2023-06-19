import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import MemberService from '../memberService'
import MemberRepository from '../../database/repositories/memberRepository'
import ActivityRepository from '../../database/repositories/activityRepository'
import TagRepository from '../../database/repositories/tagRepository'
import Error404 from '../../errors/Error404'
import Error400 from '../../errors/Error400'
import { MemberAttributeName, MemberAttributeType, PlatformType } from '@crowd/types'
import OrganizationRepository from '../../database/repositories/organizationRepository'
import TaskRepository from '../../database/repositories/taskRepository'
import NoteRepository from '../../database/repositories/noteRepository'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import SettingsRepository from '../../database/repositories/settingsRepository'
import OrganizationService from '../organizationService'
import Plans from '../../security/plans'
import { generateUUIDv1 } from '@crowd/common'
import lodash from 'lodash'
import {
  DEVTO_MEMBER_ATTRIBUTES,
  DISCORD_MEMBER_ATTRIBUTES,
  GITHUB_MEMBER_ATTRIBUTES,
  SLACK_MEMBER_ATTRIBUTES,
  TWITTER_MEMBER_ATTRIBUTES,
} from '@crowd/integrations'

const db = null

describe('MemberService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('upsert method', () => {
    it('Should throw 400 error when platform does not exist in member data', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        emails: ['lala@l.com'],
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      await expect(() =>
        new MemberService(mockIServiceOptions).upsert(member1),
      ).rejects.toThrowError(new Error400())
    })

    it('Should create non existent member - attributes with matching platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await mas.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await mas.createPredefined(DISCORD_MEMBER_ATTRIBUTES)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
            [PlatformType.TWITTER]: 'https://some-twitter-url',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.TWITTER]: '#twitterId',
            [PlatformType.DISCORD]: '#discordId',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.TWITTER]: 'https://some-image-url',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform, username, attributes } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [platform]: [username],
        },
        displayName: username,
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.DISCORD]: attributes[MemberAttributeName.SOURCE_ID][PlatformType.DISCORD],
            [PlatformType.TWITTER]: attributes[MemberAttributeName.SOURCE_ID][PlatformType.TWITTER],
            default: attributes[MemberAttributeName.SOURCE_ID][PlatformType.TWITTER],
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.TWITTER]:
              attributes[MemberAttributeName.AVATAR_URL][PlatformType.TWITTER],
            default: attributes[MemberAttributeName.AVATAR_URL][PlatformType.TWITTER],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
            [PlatformType.TWITTER]: attributes[MemberAttributeName.URL][PlatformType.TWITTER],
            default: attributes[MemberAttributeName.URL][PlatformType.TWITTER],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          },
        },
        emails: member1.emails,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        organizations: [],
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - object type username', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.TWITTER]: 'anil_twitter',
        },
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      // Save some attributes since they get modified in the upsert function
      const { username, attributes } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [PlatformType.GITHUB]: ['anil'],
          [PlatformType.TWITTER]: ['anil_twitter'],
        },
        displayName: 'anil',
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          },
        },
        emails: member1.emails,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        reach: { total: -1 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - reach as number', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {},
        reach: 10,
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform, username } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [platform]: [username],
        },
        displayName: username,
        attributes: {},
        emails: member1.emails,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 10, [PlatformType.GITHUB]: 10 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - reach as object, platform in object', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        reach: { [PlatformType.GITHUB]: 10, [PlatformType.TWITTER]: 10 },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform, username } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [platform]: [username],
        },
        displayName: username,
        attributes: {},
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        emails: member1.emails,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 20, [PlatformType.GITHUB]: 10, [PlatformType.TWITTER]: 10 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - reach as object, platform not in object', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        reach: { [PlatformType.DISCORD]: 10, [PlatformType.TWITTER]: 10 },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform, username } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [platform]: [username],
        },
        displayName: username,
        attributes: {},
        emails: member1.emails,
        score: member1.score,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 20, [PlatformType.DISCORD]: 10, [PlatformType.TWITTER]: 10 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - organization as name, no enrichment', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {},
        reach: 10,
        bio: 'Computer Science',
        organizations: ['crowd.dev'],
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const organization = (await OrganizationRepository.findAndCountAll({}, mockIServiceOptions))
        .rows[0]

      const foundMember = await MemberRepository.findById(memberCreated.id, mockIServiceOptions)

      const o1 = foundMember.organizations[0].dataValues
      delete o1.createdAt
      delete o1.updatedAt

      expect(o1).toStrictEqual({
        id: organization.id,
        name: 'crowd.dev',
        displayName: 'crowd.dev',
        url: null,
        github: null,
        location: null,
        website: null,
        description: null,
        parentUrl: null,
        emails: null,
        phoneNumbers: null,
        logo: null,
        tags: null,
        twitter: null,
        linkedin: null,
        crunchbase: null,
        employees: null,
        revenueRange: null,
        importHash: null,
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        isTeamOrganization: false,
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
      })
    })

    it('Should create non existent member - organization as object, no enrichment', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {},
        reach: 10,
        bio: 'Computer Science',
        organizations: [{ name: 'crowd.dev', url: 'https://crowd.dev', description: 'Here' }],
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const organization = (await OrganizationRepository.findAndCountAll({}, mockIServiceOptions))
        .rows[0]

      const foundMember = await MemberRepository.findById(memberCreated.id, mockIServiceOptions)

      const o1 = foundMember.organizations[0].dataValues
      delete o1.createdAt
      delete o1.updatedAt

      expect(o1).toStrictEqual({
        id: organization.id,
        name: 'crowd.dev',
        displayName: 'crowd.dev',
        url: 'https://crowd.dev',
        github: null,
        location: null,
        website: null,
        description: 'Here',
        parentUrl: null,
        emails: null,
        phoneNumbers: null,
        logo: null,
        tags: null,
        twitter: null,
        linkedin: null,
        crunchbase: null,
        employees: null,
        revenueRange: null,
        importHash: null,
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        isTeamOrganization: false,
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
      })
    })

    it('Should create non existent member - organization as id, no enrichment', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const oCreated = await new OrganizationService(mockIServiceOptions).findOrCreate({
        name: 'crowd.dev',
      })

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {},
        reach: 10,
        bio: 'Computer Science',
        organizations: [oCreated.id],
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const organization = (await OrganizationRepository.findAndCountAll({}, mockIServiceOptions))
        .rows[0]

      const foundMember = await MemberRepository.findById(memberCreated.id, mockIServiceOptions)

      const o1 = foundMember.organizations[0].dataValues
      delete o1.createdAt
      delete o1.updatedAt

      expect(o1).toStrictEqual({
        id: organization.id,
        name: 'crowd.dev',
        displayName: 'crowd.dev',
        url: null,
        github: null,
        location: null,
        website: null,
        description: null,
        parentUrl: null,
        emails: null,
        phoneNumbers: null,
        logo: null,
        tags: null,
        twitter: null,
        linkedin: null,
        crunchbase: null,
        employees: null,
        revenueRange: null,
        importHash: null,
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        isTeamOrganization: false,
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
      })
    })

    it('Should create non existent member - organization with enrichment', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {},
        reach: 10,
        bio: 'Computer Science',
        organizations: [{ name: 'crowd.dev', url: 'https://crowd.dev', description: 'Here' }],
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const organization = (await OrganizationRepository.findAndCountAll({}, mockIServiceOptions))
        .rows[0]

      const foundMember = await MemberRepository.findById(memberCreated.id, mockIServiceOptions)

      const o1 = foundMember.organizations[0].dataValues
      delete o1.createdAt
      delete o1.updatedAt

      expect(o1).toStrictEqual({
        id: organization.id,
        name: 'crowd.dev',
        displayName: 'crowd.dev',
        url: 'crowd.dev',
        github: null,
        location: null,
        website: null,
        description:
          'Understand, grow, and engage your developer community with zero hassle. With crowd.dev, you can build developer communities that drive your business forward.',
        parentUrl: null,
        emails: ['hello@crowd.dev', 'jonathan@crowd.dev', 'careers@crowd.dev'],
        phoneNumbers: ['+42 424242'],
        logo: 'https://logo.clearbit.com/crowd.dev',
        tags: [],
        twitter: {
          id: '1362101830923259908',
          bio: 'Community-led Growth for Developer-first Companies.\nJoin our private beta. 👇',
          site: 'https://t.co/GRLDhqFWk4',
          avatar: 'https://pbs.twimg.com/profile_images/1419741008716251141/6exZe94-_normal.jpg',
          handle: 'CrowdDotDev',
          location: '🌍 remote',
          followers: 107,
          following: 0,
        },
        linkedin: {
          handle: 'company/crowddevhq',
        },
        crunchbase: {
          handle: null,
        },
        employees: 5,
        revenueRange: {
          max: 1,
          min: 0,
        },
        importHash: null,
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        isTeamOrganization: false,
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
      })
    })

    it('Should update existent member succesfully - simple', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const member1 = {
        username: 'anil',
        emails: ['lala@l.com'],
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const attributes = member1.attributes

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        emails: ['test@email.com', 'test2@email.com'],
        platform: PlatformType.GITHUB,
        location: 'Ankara',
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [PlatformType.GITHUB]: [member1Username],
        },
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          },
        },
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        emails: ['lala@l.com', 'test@email.com', 'test2@email.com'],
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        reach: { total: -1 },
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member successfully - attributes with matching platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await mas.createPredefined(TWITTER_MEMBER_ATTRIBUTES)

      const member1 = {
        username: 'anil',
        emails: ['lala@l.com'],
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const attributes1 = member1.attributes

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        attributes: {
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
          [MemberAttributeName.URL]: {
            [PlatformType.TWITTER]: 'https://twitter-url',
          },
        },
      }

      const attributes2 = member2.attributes

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [PlatformType.GITHUB]: [member1Username],
        },
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]:
              attributes1[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
            default: attributes1[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes1[MemberAttributeName.URL][PlatformType.GITHUB],
            [PlatformType.TWITTER]: attributes2[MemberAttributeName.URL][PlatformType.TWITTER],
            default: attributes2[MemberAttributeName.URL][PlatformType.TWITTER],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]:
              attributes2[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
            default: attributes2[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes2[MemberAttributeName.BIO][PlatformType.GITHUB],
            default: attributes2[MemberAttributeName.BIO][PlatformType.GITHUB],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes2[MemberAttributeName.LOCATION][PlatformType.GITHUB],
            default: attributes2[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          },
        },
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        emails: member1.emails,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        reach: { total: -1 },
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - object type username', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const member1 = {
        username: 'anil',
        emails: ['lala@l.com'],
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const attributes = member1.attributes

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.TWITTER]: 'anil_twitter',
          [PlatformType.DISCORD]: 'anil_discord',
        },
        platform: PlatformType.GITHUB,
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [PlatformType.GITHUB]: ['anil'],
          [PlatformType.TWITTER]: ['anil_twitter'],
          [PlatformType.DISCORD]: ['anil_discord'],
        },
        displayName: 'anil',
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
            default: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          },
        },
        emails: member1.emails,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        reach: { total: -1 },
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should throw 400 error when given platform does not match with username object ', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const member1 = {
        username: 'anil',
        emails: ['lala@l.com'],
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.TWITTER]: 'anil_twitter',
          [PlatformType.DISCORD]: 'anil_discord',
        },
        platform: PlatformType.SLACK,
      }

      await expect(() =>
        new MemberService(mockIServiceOptions).upsert(member2),
      ).rejects.toThrowError(new Error400())
    })

    it('Should update existent member succesfully - JSON fields', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await mas.createPredefined(DEVTO_MEMBER_ATTRIBUTES)

      const member1 = {
        username: 'anil',
        platform: PlatformType.TWITTER,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const attributes1 = member1.attributes

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.TWITTER,
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Ankara',
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.DEVTO]: '#someDevtoId',
            [PlatformType.SLACK]: '#someSlackId',
          },
          [MemberAttributeName.NAME]: {
            [PlatformType.DEVTO]: 'Michael Scott',
          },
          [MemberAttributeName.URL]: {
            [PlatformType.DEVTO]: 'https://some-devto-url',
          },
        },
      }

      const attributes2 = member2.attributes

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          [PlatformType.TWITTER]: [member1Username],
        },
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.DEVTO]: attributes2[MemberAttributeName.SOURCE_ID][PlatformType.DEVTO],
            [PlatformType.SLACK]: attributes2[MemberAttributeName.SOURCE_ID][PlatformType.SLACK],
            default: attributes2[MemberAttributeName.SOURCE_ID][PlatformType.DEVTO],
          },
          [MemberAttributeName.NAME]: {
            [PlatformType.DEVTO]: attributes2[MemberAttributeName.NAME][PlatformType.DEVTO],
            default: attributes2[MemberAttributeName.NAME][PlatformType.DEVTO],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]:
              attributes1[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
            default: attributes1[MemberAttributeName.IS_HIREABLE][PlatformType.GITHUB],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes1[MemberAttributeName.URL][PlatformType.GITHUB],
            [PlatformType.DEVTO]: attributes2[MemberAttributeName.URL][PlatformType.DEVTO],
            default: attributes1[MemberAttributeName.URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]:
              attributes1[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
            default: attributes1[MemberAttributeName.WEBSITE_URL][PlatformType.GITHUB],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes1[MemberAttributeName.BIO][PlatformType.GITHUB],
            default: attributes1[MemberAttributeName.BIO][PlatformType.GITHUB],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes1[MemberAttributeName.LOCATION][PlatformType.GITHUB],
            default: attributes1[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          },
        },
        emails: member1.emails,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: -1 },
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - reach from default to complete - sending number', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        reach: 10,
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          [PlatformType.GITHUB]: [member1Username],
        },
        displayName: member1Username,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        reach: { total: 10, [PlatformType.GITHUB]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        emails: [],
        attributes: {},
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - reach from default to complete - sending platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        type: 'member',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        reach: { [PlatformType.GITHUB]: 10 },
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          [PlatformType.GITHUB]: [member1Username],
        },
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        displayName: member1Username,
        reach: { total: 10, [PlatformType.GITHUB]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        emails: [],
        attributes: {},
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - complex reach update from object', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        type: 'member',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
        reach: { [PlatformType.TWITTER]: 10, linkedin: 10, total: 20 },
      }

      const member1Username = member1.username

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        reach: { [PlatformType.GITHUB]: 15, linkedin: 11 },
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          [PlatformType.GITHUB]: [member1Username],
        },
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        displayName: member1Username,
        reach: { total: 36, [PlatformType.GITHUB]: 15, linkedin: 11, [PlatformType.TWITTER]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        emails: [],
        attributes: {},
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - complex reach update from number', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        type: 'member',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
        reach: { [PlatformType.TWITTER]: 10, linkedin: 10, total: 20 },
      }

      const member1Username = member1.username

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        reach: 30,
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          [PlatformType.GITHUB]: [member1Username],
        },
        displayName: member1Username,
        lastEnriched: null,
        organizations: [],
        enrichedBy: [],
        contributions: null,
        reach: { total: 50, [PlatformType.GITHUB]: 30, linkedin: 10, [PlatformType.TWITTER]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        segments: mockIServiceOptions.currentSegments,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        emails: [],
        attributes: {},
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })
  })

  describe('update method', () => {
    it('Should update existent member succesfully - removing identities with simple string format', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        type: 'member',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      const toUpdate = {
        username: 'anil_new',
        platform: PlatformType.GITHUB,
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).update(
        memberCreated.id,
        toUpdate,
      )

      expect(memberUpdated.username[PlatformType.GITHUB]).toStrictEqual(['anil_new'])
    })

    it('Should update existent member succesfully - removing identities with simple identity format', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil',
          },
        },
        platform: PlatformType.GITHUB,
        type: 'member',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      const toUpdate = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil_new',
          },
        },
        platform: PlatformType.GITHUB,
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).update(
        memberCreated.id,
        toUpdate,
      )

      expect(memberUpdated.username[PlatformType.GITHUB]).toStrictEqual(['anil_new'])
    })

    it('Should update existent member succesfully - removing identities with array identity format', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: [
            {
              username: 'anil',
            },
          ],
        },
        platform: PlatformType.GITHUB,
        type: 'member',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      const toUpdate = {
        username: {
          [PlatformType.GITHUB]: [
            {
              username: 'anil_new',
            },
            {
              username: 'anil_new2',
            },
          ],
        },
        platform: PlatformType.GITHUB,
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).update(
        memberCreated.id,
        toUpdate,
      )

      expect(memberUpdated.username[PlatformType.GITHUB]).toStrictEqual(['anil_new', 'anil_new2'])
    })
  })

  describe('merge method', () => {
    it('Should merge', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await mas.createPredefined(DISCORD_MEMBER_ATTRIBUTES)
      await mas.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await mas.createPredefined(SLACK_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      let t1 = await TagRepository.create({ name: 'tag1' }, mockIRepositoryOptions)
      let t2 = await TagRepository.create({ name: 'tag2' }, mockIRepositoryOptions)
      let t3 = await TagRepository.create({ name: 'tag3' }, mockIRepositoryOptions)

      let o1 = await OrganizationRepository.create({ name: 'org1' }, mockIRepositoryOptions)
      let o2 = await OrganizationRepository.create({ name: 'org2' }, mockIRepositoryOptions)
      let o3 = await OrganizationRepository.create({ name: 'org3' }, mockIRepositoryOptions)

      let task1 = await TaskRepository.create({ name: 'task1' }, mockIRepositoryOptions)
      let task2 = await TaskRepository.create({ name: 'task2' }, mockIRepositoryOptions)
      let task3 = await TaskRepository.create({ name: 'task3' }, mockIRepositoryOptions)

      let note1 = await NoteRepository.create({ body: 'note1' }, mockIRepositoryOptions)
      let note2 = await NoteRepository.create({ body: 'note2' }, mockIRepositoryOptions)
      let note3 = await NoteRepository.create({ body: 'note3' }, mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        emails: ['anil+1@crowd.dev', 'anil+2@crowd.dev'],
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
        tags: [t1.id, t2.id],
        organizations: [o1.id, o2.id],
        tasks: [task1.id, task2.id],
        notes: [note1.id, note2.id],
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: 'anil',
        },
        emails: ['anil+1@crowd.dev', 'anil+3@crowd.dev'],
        displayName: 'Anil',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Crowd.dev',
            default: 'Crowd.dev',
          },
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.DISCORD]: '#discordId',
            default: '#discordId',
          },
        },
        tags: [t2.id, t3.id],
        organizations: [o2.id, o3.id],
        tasks: [task2.id, task3.id],
        notes: [note2.id, note3.id],
      }

      const member3 = {
        username: {
          [PlatformType.TWITTER]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.URL]: {
            [PlatformType.TWITTER]: 'https://a-twitter-url',
            default: 'https://a-twitter-url',
          },
        },
      }
      const member4 = {
        username: {
          [PlatformType.SLACK]: 'testt',
        },
        displayName: 'Member 4',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.SLACK]: '#slackId',
            default: '#slackId',
          },
        },
      }

      const returnedMember1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const returnedMember2 = await MemberRepository.create(member2, mockIRepositoryOptions)
      const returnedMember3 = await MemberRepository.create(member3, mockIRepositoryOptions)
      const returnedMember4 = await MemberRepository.create(member4, mockIRepositoryOptions)

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        attributes: {
          replies: 12,
          body: 'Here',
        },
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        isContribution: true,
        username: 'anil',
        member: returnedMember2.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // toMerge[1] = [(1,2),(1,4)] toMerge[2] = [(2,1)] toMerge[4] = [(4,1)]
      // noMerge[2] = [3]
      await MemberRepository.addToMerge(
        [{ members: [returnedMember1.id, returnedMember2.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember1.id, returnedMember4.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember2.id, returnedMember1.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember4.id, returnedMember1.id], similarity: null }],
        mockIRepositoryOptions,
      )

      await MemberRepository.addNoMerge(
        returnedMember2.id,
        returnedMember3.id,
        mockIRepositoryOptions,
      )

      const response = await memberService.merge(returnedMember1.id, returnedMember2.id)

      const mergedMember = await MemberRepository.findById(
        response.mergedId,
        mockIRepositoryOptions,
      )

      // Sequelize returns associations as array of models, we need to get plain objects
      mergedMember.activities = mergedMember.activities.map((i) => i.get({ plain: true }))
      mergedMember.tags = mergedMember.tags.map((i) => i.get({ plain: true }))
      mergedMember.organizations = mergedMember.organizations.map((i) => i.get({ plain: true }))
      mergedMember.tasks = mergedMember.tasks.map((i) => i.get({ plain: true }))
      mergedMember.notes = mergedMember.notes.map((i) => i.get({ plain: true }))

      // get the created activity again, it's member should be updated after merge
      activityCreated = await ActivityRepository.findById(
        activityCreated.id,
        mockIRepositoryOptions,
      )

      // we don't need activity.member because we're already expecting member->activities
      activityCreated = SequelizeTestUtils.objectWithoutKey(activityCreated, [
        'member',
        'objectMember',
        'parent',
        'tasks',
        'display',
      ])

      // get previously created tags
      t1 = await TagRepository.findById(t1.id, mockIRepositoryOptions)
      t2 = await TagRepository.findById(t2.id, mockIRepositoryOptions)
      t3 = await TagRepository.findById(t3.id, mockIRepositoryOptions)

      // get previously created organizations
      o1 = await OrganizationRepository.findById(o1.id, mockIRepositoryOptions)
      o2 = await OrganizationRepository.findById(o2.id, mockIRepositoryOptions)
      o3 = await OrganizationRepository.findById(o3.id, mockIRepositoryOptions)

      // get previously created tasks
      task1 = await TaskRepository.findById(task1.id, mockIRepositoryOptions)
      task2 = await TaskRepository.findById(task2.id, mockIRepositoryOptions)
      task3 = await TaskRepository.findById(task3.id, mockIRepositoryOptions)

      // get previously created notes
      note1 = await NoteRepository.findById(note1.id, mockIRepositoryOptions)
      note2 = await NoteRepository.findById(note2.id, mockIRepositoryOptions)
      note3 = await NoteRepository.findById(note3.id, mockIRepositoryOptions)

      // remove tags->member relations as well (we should be only checking 1-deep relations)
      t1 = SequelizeTestUtils.objectWithoutKey(t1, 'members')
      t2 = SequelizeTestUtils.objectWithoutKey(t2, 'members')
      t3 = SequelizeTestUtils.objectWithoutKey(t3, 'members')

      // remove organizations->member relations as well (we should be only checking 1-deep relations)
      o1 = SequelizeTestUtils.objectWithoutKey(o1, ['memberCount', 'joinedAt', 'activityCount'])
      o2 = SequelizeTestUtils.objectWithoutKey(o2, ['memberCount', 'joinedAt', 'activityCount'])
      o3 = SequelizeTestUtils.objectWithoutKey(o3, ['memberCount', 'joinedAt', 'activityCount'])

      // remove tasks->member and tasks->activity tasks->assignees relations as well (we should be only checking 1-deep relations)
      task1 = SequelizeTestUtils.objectWithoutKey(task1, ['members', 'activities', 'assignees'])
      task2 = SequelizeTestUtils.objectWithoutKey(task2, ['members', 'activities', 'assignees'])
      task3 = SequelizeTestUtils.objectWithoutKey(task3, ['members', 'activities', 'assignees'])

      // remove notes->member relations as well (we should be only checking 1-deep relations)
      note1 = SequelizeTestUtils.objectWithoutKey(note1, ['members', 'createdBy'])
      note2 = SequelizeTestUtils.objectWithoutKey(note2, ['members', 'createdBy'])
      note3 = SequelizeTestUtils.objectWithoutKey(note3, ['members', 'createdBy'])

      mergedMember.updatedAt = mergedMember.updatedAt.toISOString().split('T')[0]

      const expectedMember = {
        id: returnedMember1.id,
        username: {
          [PlatformType.GITHUB]: ['anil'],
          [PlatformType.DISCORD]: ['anil'],
        },
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        displayName: 'Anil',
        identities: [PlatformType.GITHUB, PlatformType.DISCORD],
        activities: [activityCreated],
        attributes: {
          ...member1.attributes,
          ...member2.attributes,
        },
        activeOn: [activityCreated.platform],
        activityTypes: [`${activityCreated.platform}:${activityCreated.type}`],
        emails: ['anil+1@crowd.dev', 'anil+2@crowd.dev', 'anil+3@crowd.dev'],
        score: -1,
        importHash: null,
        createdAt: returnedMember1.createdAt,
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        joinedAt: new Date(member1.joinedAt),
        reach: { total: -1 },
        tags: [t1, t2, t3],
        tasks: [task1, task2, task3],
        notes: [note1, note2, note3],
        organizations: [
          SequelizeTestUtils.objectWithoutKey(o1, [
            'activeOn',
            'identities',
            'lastActive',
            'segments',
          ]),
          SequelizeTestUtils.objectWithoutKey(o2, [
            'activeOn',
            'identities',
            'lastActive',
            'segments',
          ]),
          SequelizeTestUtils.objectWithoutKey(o3, [
            'activeOn',
            'identities',
            'lastActive',
            'segments',
          ]),
        ],
        noMerge: [returnedMember3.id],
        toMerge: [returnedMember4.id],
        activityCount: 1,
        activeDaysCount: 1,
        averageSentiment: activityCreated.sentiment.sentiment,
        lastActive: activityCreated.timestamp,
        lastActivity: activityCreated,
        numberOfOpenSourceContributions: 0,
      }

      expect(
        mergedMember.tasks.sort((a, b) => {
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          if (nameA < nameB) {
            return -1
          }
          if (nameA > nameB) {
            return 1
          }
          return 0
        }),
      ).toEqual(
        expectedMember.tasks.sort((a, b) => {
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          if (nameA < nameB) {
            return -1
          }
          if (nameA > nameB) {
            return 1
          }
          return 0
        }),
      )
      delete mergedMember.tasks
      delete expectedMember.tasks
      expect(mergedMember).toStrictEqual(expectedMember)
    })

    it('Should catch when two members are the same', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      const memberCreated = await MemberRepository.create(member1, mockIRepositoryOptions)
      const mergeOutput = await memberService.merge(memberCreated.id, memberCreated.id)

      expect(mergeOutput).toStrictEqual({ status: 203, mergedId: memberCreated.id })

      const found = await memberService.findById(memberCreated.id)
      expect(found).toStrictEqual(memberCreated)
    })
  })

  describe('addToNoMerge method', () => {
    it('Should add two members to their respective noMerges, these members should be excluded from toMerges respectively', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await mas.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await mas.createPredefined(DISCORD_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.DISCORD]: '#discordId',
            default: '#discordId',
          },
        },
      }

      const member3 = {
        username: {
          [PlatformType.TWITTER]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.URL]: {
            [PlatformType.TWITTER]: 'https://a-twitter-url',
            default: 'https://a-twitter-url',
          },
        },
      }

      let returnedMember1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      let returnedMember2 = await MemberRepository.create(member2, mockIRepositoryOptions)
      let returnedMember3 = await MemberRepository.create(member3, mockIRepositoryOptions)

      // toMerge[1] = [(1,2),(1,3)] toMerge[2] = [(2,1),(2,3)] toMerge[3] = [(3,1),(3,2)]
      await MemberRepository.addToMerge(
        [{ members: [returnedMember1.id, returnedMember2.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember2.id, returnedMember1.id], similarity: null }],
        mockIRepositoryOptions,
      )

      await MemberRepository.addToMerge(
        [{ members: [returnedMember1.id, returnedMember3.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember3.id, returnedMember1.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember2.id, returnedMember3.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [returnedMember3.id, returnedMember2.id], similarity: null }],
        mockIRepositoryOptions,
      )

      await memberService.addToNoMerge(returnedMember1.id, returnedMember2.id)

      returnedMember1 = await MemberRepository.findById(returnedMember1.id, mockIRepositoryOptions)

      expect(returnedMember1.toMerge).toStrictEqual([returnedMember3.id])
      expect(returnedMember1.noMerge).toStrictEqual([returnedMember2.id])

      returnedMember2 = await MemberRepository.findById(returnedMember2.id, mockIRepositoryOptions)

      expect(returnedMember2.toMerge).toStrictEqual([returnedMember3.id])
      expect(returnedMember2.noMerge).toStrictEqual([returnedMember1.id])

      // call addToNoMerge once more, between member1 and member3
      await memberService.addToNoMerge(returnedMember1.id, returnedMember3.id)

      returnedMember1 = await MemberRepository.findById(returnedMember1.id, mockIRepositoryOptions)

      expect(returnedMember1.toMerge).toStrictEqual([])
      expect(returnedMember1.noMerge).toStrictEqual([returnedMember2.id, returnedMember3.id])

      returnedMember3 = await MemberRepository.findById(returnedMember3.id, mockIRepositoryOptions)

      expect(returnedMember3.toMerge).toStrictEqual([returnedMember2.id])
      expect(returnedMember3.noMerge).toStrictEqual([returnedMember1.id])

      // only toMerge relation (2,3) left. Testing addToNoMerge(2,3)
      await memberService.addToNoMerge(returnedMember3.id, returnedMember2.id)

      returnedMember2 = await MemberRepository.findById(returnedMember2.id, mockIRepositoryOptions)

      expect(returnedMember2.toMerge).toStrictEqual([])
      expect(returnedMember2.noMerge).toStrictEqual([returnedMember1.id, returnedMember3.id])

      returnedMember3 = await MemberRepository.findById(returnedMember3.id, mockIRepositoryOptions)

      expect(returnedMember3.toMerge).toStrictEqual([])
      expect(returnedMember3.noMerge).toStrictEqual([returnedMember1.id, returnedMember2.id])
    })

    it('Should throw 404 not found when trying to add non existent members to noMerge', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      const returnedMember1 = await MemberRepository.create(member1, mockIRepositoryOptions)

      const { randomUUID } = require('crypto')

      await expect(() =>
        memberService.addToNoMerge(returnedMember1.id, randomUUID()),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('memberExists method', () => {
    it('Should find existing member with string username and default platform', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      const cloned = lodash.cloneDeep(member1)
      const returnedMember1 = await MemberRepository.create(cloned, mockIRepositoryOptions)
      delete returnedMember1.toMerge
      delete returnedMember1.noMerge
      delete returnedMember1.tags
      delete returnedMember1.activities
      delete returnedMember1.tasks
      delete returnedMember1.notes
      delete returnedMember1.activityCount
      delete returnedMember1.averageSentiment
      delete returnedMember1.lastActive
      delete returnedMember1.lastActivity
      delete returnedMember1.activeOn
      delete returnedMember1.identities
      delete returnedMember1.activityTypes
      delete returnedMember1.activeDaysCount
      delete returnedMember1.numberOfOpenSourceContributions
      returnedMember1.segments = returnedMember1.segments.map((s) => s.id)

      const existing = await memberService.memberExists(
        member1.username[PlatformType.GITHUB],
        PlatformType.GITHUB,
      )

      expect(existing).toStrictEqual(returnedMember1)
    })

    it('Should return null if member is not found - string type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      const existing = await memberService.memberExists('some-random-username', PlatformType.GITHUB)

      expect(existing).toBeNull()
    })

    it('Should return null if member is not found - object type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      const existing = await memberService.memberExists(
        {
          ...member1.username,
          [PlatformType.SLACK]: 'some-slack-username',
        },
        PlatformType.SLACK,
      )

      expect(existing).toBeNull()
    })

    it('Should find existing member with object username and given platform', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.DISCORD]: 'some-other-username',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      const returnedMember1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      delete returnedMember1.toMerge
      delete returnedMember1.noMerge
      delete returnedMember1.tags
      delete returnedMember1.activities
      delete returnedMember1.tasks
      delete returnedMember1.notes
      delete returnedMember1.activityCount
      delete returnedMember1.averageSentiment
      delete returnedMember1.lastActive
      delete returnedMember1.lastActivity
      delete returnedMember1.activeOn
      delete returnedMember1.identities
      delete returnedMember1.activityTypes
      delete returnedMember1.activeDaysCount
      delete returnedMember1.numberOfOpenSourceContributions
      returnedMember1.segments = returnedMember1.segments.map((s) => s.id)

      const existing = await memberService.memberExists(
        { [PlatformType.DISCORD]: 'some-other-username' },
        PlatformType.DISCORD,
      )

      expect(returnedMember1).toStrictEqual(existing)
    })

    it('Should throw 400 error when username is type of object and username[platform] is not present ', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.DISCORD]: 'some-other-username',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {},
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        memberService.memberExists(
          { [PlatformType.DISCORD]: 'some-other-username' },
          PlatformType.SLACK,
        ),
      ).rejects.toThrowError(new Error400())
    })
  })

  describe('Update Reach method', () => {
    it('Should keep as total: -1 for an empty new reach and a default old reach', async () => {
      const oldReach = { total: -1 }
      const updatedReach = MemberService.calculateReach({}, oldReach)
      expect(updatedReach).toStrictEqual({
        total: -1,
      })
    })
    it('Should keep as total: -1 for a default new reach and a default old reach', async () => {
      const oldReach = { total: -1 }
      const updatedReach = MemberService.calculateReach({ total: -1 }, oldReach)
      expect(updatedReach).toStrictEqual({
        total: -1,
      })
    })
    it('Should update for a new reach and a default old reach', async () => {
      const oldReach = { total: -1 }
      const newReach = { [PlatformType.TWITTER]: 10 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 10,
        [PlatformType.TWITTER]: 10,
      })
    })
    it('Should update for a new reach and old reach in the same platform', async () => {
      const oldReach = { [PlatformType.TWITTER]: 5, total: 5 }
      const newReach = { [PlatformType.TWITTER]: 10 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 10,
        [PlatformType.TWITTER]: 10,
      })
    })
    it('Should update for a complex reach with different platforms', async () => {
      const oldReach = {
        [PlatformType.TWITTER]: 10,
        [PlatformType.GITHUB]: 20,
        [PlatformType.DISCORD]: 50,
        total: 10 + 20 + 50,
      }
      const newReach = {
        [PlatformType.TWITTER]: 20,
        [PlatformType.GITHUB]: 2,
        linkedin: 10,
        total: 20 + 2 + 10,
      }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 10 + 20 + 2 + 50,
        [PlatformType.TWITTER]: 20,
        [PlatformType.GITHUB]: 2,
        linkedin: 10,
        [PlatformType.DISCORD]: 50,
      })
    })
    it('Should work with reach 0', async () => {
      const oldReach = { total: -1 }
      const newReach = { [PlatformType.TWITTER]: 0 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 0,
        [PlatformType.TWITTER]: 0,
      })
    })
  })

  describe('getHighestPriorityPlatformForAttributes method', () => {
    it('Should return the highest priority platform from a priority array, handling the exceptions', async () => {
      const priorityArray = [
        PlatformType.TWITTER,
        PlatformType.CROWD,
        PlatformType.SLACK,
        PlatformType.DEVTO,
        PlatformType.DISCORD,
        PlatformType.GITHUB,
      ]

      let inputPlatforms = [PlatformType.GITHUB, PlatformType.DEVTO]
      let highestPriorityPlatform = MemberService.getHighestPriorityPlatformForAttributes(
        inputPlatforms,
        priorityArray,
      )

      expect(highestPriorityPlatform).toBe(PlatformType.DEVTO)

      inputPlatforms = [PlatformType.GITHUB, 'someOtherPlatform'] as any
      highestPriorityPlatform = MemberService.getHighestPriorityPlatformForAttributes(
        inputPlatforms,
        priorityArray,
      )

      expect(highestPriorityPlatform).toBe(PlatformType.GITHUB)

      inputPlatforms = ['somePlatform1', 'somePlatform2'] as any

      // if no match in the priority array, it should return the first platform it finds
      highestPriorityPlatform = MemberService.getHighestPriorityPlatformForAttributes(
        inputPlatforms,
        priorityArray,
      )

      expect(highestPriorityPlatform).toBe('somePlatform1')

      inputPlatforms = []

      // if no platforms are sent to choose from, it should return undefined
      highestPriorityPlatform = MemberService.getHighestPriorityPlatformForAttributes(
        inputPlatforms,
        priorityArray,
      )
      expect(highestPriorityPlatform).not.toBeDefined()
    })
  })

  describe('validateAttributes method', () => {
    it('Should validate attributes object succesfully', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(DEVTO_MEMBER_ATTRIBUTES)

      const attributes = {
        [MemberAttributeName.NAME]: {
          [PlatformType.DEVTO]: 'Dweet Srute',
        },
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: 'https://some-github-url',
          [PlatformType.TWITTER]: 'https://some-twitter-url',
          [PlatformType.DEVTO]: 'https://some-devto-url',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: 'Berlin',
          [PlatformType.DEVTO]: 'Istanbul',
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: 'Assistant to the Regional Manager',
          [PlatformType.DEVTO]: 'Assistant Regional Manager',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
        },
      }

      const validateAttributes = await memberService.validateAttributes(attributes)

      expect(validateAttributes).toEqual(attributes)
    })

    it(`Should accept custom attributes without 'custom' platform key`, async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)

      const attributes = {
        [MemberAttributeName.BIO]: 'Assistant to the Regional Manager',
      }

      const validateAttributes = await memberService.validateAttributes(attributes)

      const expectedValidatedAttributes = {
        [MemberAttributeName.BIO]: {
          custom: 'Assistant to the Regional Manager',
        },
      }

      expect(validateAttributes).toEqual(expectedValidatedAttributes)
    })

    it(`Should accept custom attributes both without and with 'custom' platform key`, async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(DEVTO_MEMBER_ATTRIBUTES)

      const attributes = {
        [MemberAttributeName.NAME]: 'Dwight Schrute',
        [MemberAttributeName.URL]: 'https://some-url',
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: 'Berlin',
          [PlatformType.DEVTO]: 'Istanbul',
          custom: 'a custom location',
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: 'Assistant to the Regional Manager',
          [PlatformType.DEVTO]: 'Assistant Regional Manager',
          custom: 'a custom bio',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
          custom: 'a custom image url',
        },
      }

      const validateAttributes = await memberService.validateAttributes(attributes)

      const expectedValidatedAttributes = {
        [MemberAttributeName.NAME]: {
          custom: 'Dwight Schrute',
        },
        [MemberAttributeName.URL]: {
          custom: 'https://some-url',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: 'Berlin',
          [PlatformType.DEVTO]: 'Istanbul',
          custom: 'a custom location',
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: 'Assistant to the Regional Manager',
          [PlatformType.DEVTO]: 'Assistant Regional Manager',
          custom: 'a custom bio',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
          custom: 'a custom image url',
        },
      }

      expect(validateAttributes).toEqual(expectedValidatedAttributes)
    })

    it('Should throw a 400 Error when an attribute does not exist in member attribute settings', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)

      // in settings name has a string type, inserting an integer should throw an error
      const attributes = {
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: 'https://some-github-url',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
        },
        'non-existing-attribute': {
          [PlatformType.TWITTER]: 'some value',
        },
      }
      const validateAttributes = await memberService.validateAttributes(attributes)

      // member attribute that is non existing in settings, should be omitted after validate
      const expectedValidatedAttributes = {
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: 'https://some-github-url',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
        },
      }
      expect(validateAttributes).toEqual(expectedValidatedAttributes)
    })

    it('Should throw a 400 Error when the type of an attribute does not match the type in member attribute settings', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)

      // in settings website_url has a url type, inserting an integer should throw an error
      const attributes = {
        [MemberAttributeName.WEBSITE_URL]: {
          [PlatformType.GITHUB]: 55,
        },
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: 'https://some-github-url',
          [PlatformType.TWITTER]: 'https://some-twitter-url',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
        },
      }

      await expect(() => memberService.validateAttributes(attributes)).rejects.toThrowError(
        new Error400('en', 'settings.memberAttributes.wrongType'),
      )
    })
  })
  describe('setAttributesDefaultValues method', () => {
    it('Should return the structured attributes object with default values succesfully', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(DEVTO_MEMBER_ATTRIBUTES)

      const attributes = {
        [MemberAttributeName.NAME]: {
          [PlatformType.DEVTO]: 'Dweet Srute',
        },
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: 'https://some-github-url',
          [PlatformType.TWITTER]: 'https://some-twitter-url',
          [PlatformType.DEVTO]: 'https://some-devto-url',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: 'Berlin',
          [PlatformType.DEVTO]: 'Istanbul',
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: 'Assistant to the Regional Manager',
          [PlatformType.DEVTO]: 'Assistant Regional Manager',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
        },
      }

      const attributesWithDefaultValues = await memberService.setAttributesDefaultValues(attributes)

      // Default platform priority is: custom, twitter, github, devto, slack, discord, crowd
      const expectedAttributesWithDefaultValues = {
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: attributes[MemberAttributeName.URL][PlatformType.GITHUB],
          [PlatformType.TWITTER]: attributes[MemberAttributeName.URL][PlatformType.TWITTER],
          [PlatformType.DEVTO]: attributes[MemberAttributeName.URL][PlatformType.DEVTO],
          default: attributes[MemberAttributeName.URL][PlatformType.TWITTER],
        },
        [MemberAttributeName.NAME]: {
          [PlatformType.DEVTO]: attributes[MemberAttributeName.NAME][PlatformType.DEVTO],
          default: attributes[MemberAttributeName.NAME][PlatformType.DEVTO],
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: attributes[MemberAttributeName.AVATAR_URL][PlatformType.TWITTER],
          default: attributes[MemberAttributeName.AVATAR_URL][PlatformType.TWITTER],
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
          [PlatformType.DEVTO]: attributes[MemberAttributeName.BIO][PlatformType.DEVTO],
          default: attributes[MemberAttributeName.BIO][PlatformType.GITHUB],
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
          [PlatformType.DEVTO]: attributes[MemberAttributeName.LOCATION][PlatformType.DEVTO],
          default: attributes[MemberAttributeName.LOCATION][PlatformType.GITHUB],
        },
      }

      expect(attributesWithDefaultValues).toEqual(expectedAttributesWithDefaultValues)
    })

    it('Should throw a 400 Error when priority array does not exist', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const memberService = new MemberService(mockIServiceOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(mockIServiceOptions)

      await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await memberAttributeSettingsService.createPredefined(DEVTO_MEMBER_ATTRIBUTES)

      // Empty default priority array
      const settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      await SettingsRepository.save(
        { ...settings, attributeSettings: { priorities: [] } },
        mockIServiceOptions,
      )
      const attributes = {
        [MemberAttributeName.NAME]: {
          [PlatformType.DEVTO]: 'Dweet Srute',
        },
        [MemberAttributeName.URL]: {
          [PlatformType.GITHUB]: 'https://some-github-url',
          [PlatformType.TWITTER]: 'https://some-twitter-url',
          [PlatformType.DEVTO]: 'https://some-devto-url',
        },
        [MemberAttributeName.LOCATION]: {
          [PlatformType.GITHUB]: 'Berlin',
          [PlatformType.DEVTO]: 'Istanbul',
        },
        [MemberAttributeName.BIO]: {
          [PlatformType.GITHUB]: 'Assistant to the Regional Manager',
          [PlatformType.DEVTO]: 'Assistant Regional Manager',
        },
        [MemberAttributeName.AVATAR_URL]: {
          [PlatformType.TWITTER]: 'https://some-image-url',
        },
      }

      await expect(() => memberService.setAttributesDefaultValues(attributes)).rejects.toThrowError(
        new Error400('en', 'settings.memberAttributes.priorityArrayNotFound'),
      )
    })
  })

  describe('findAndCountAll method', () => {
    it('Should filter and sort by dynamic attributes using advanced filters successfully', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const ms = new MemberService(mockIServiceOptions)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
      await mas.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
      await mas.createPredefined(DISCORD_MEMBER_ATTRIBUTES)

      const attribute1 = {
        name: 'aNumberAttribute',
        label: 'A number Attribute',
        type: MemberAttributeType.NUMBER,
        canDelete: true,
        show: true,
      }

      const attribute2 = {
        name: 'aDateAttribute',
        label: 'A date Attribute',
        type: MemberAttributeType.DATE,
        canDelete: true,
        show: true,
      }

      const attribute3 = {
        name: 'aMultiSelectAttribute',
        label: 'A multi select Attribute',
        options: ['a', 'b', 'c'],
        type: MemberAttributeType.MULTI_SELECT,
        canDelete: true,
        show: true,
      }

      await mas.create(attribute1)
      await mas.create(attribute2)
      await mas.create(attribute3)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.DISCORD]: 'anil',
          [PlatformType.TWITTER]: 'anil',
        },
        platform: PlatformType.GITHUB,
        emails: ['lala@l.com'],
        score: 10,
        attributes: {
          aDateAttribute: {
            custom: '2022-08-01T00:00:00',
          },
          aMultiSelectAttribute: {
            custom: ['a', 'b'],
            github: ['a'],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: false,
            [PlatformType.DISCORD]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/anil',
            [PlatformType.TWITTER]: 'https://twitter.com/anil',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Lazy geek',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Helsinki, Finland',
          },
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.TWITTER]: '#twitterId2',
            [PlatformType.DISCORD]: '#discordId1',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.TWITTER]: 'https://twitter.com/anil/image',
          },
          aNumberAttribute: {
            [PlatformType.GITHUB]: 1,
            [PlatformType.TWITTER]: 2,
            [PlatformType.DISCORD]: 300000,
          },
        },
        contributions: [
          {
            id: 112529473,
            url: 'https://github.com/bighead/silicon-valley',
            topics: ['TV Shows', 'Comedy', 'Startups'],
            summary: 'Silicon Valley: 50 commits in 2 weeks',
            numberCommits: 50,
            lastCommitDate: '02/01/2023',
            firstCommitDate: '01/17/2023',
          },
          {
            id: 112529474,
            url: 'https://github.com/bighead/startup-ideas',
            topics: ['Ideas', 'Startups'],
            summary: 'Startup Ideas: 20 commits in 1 week',
            numberCommits: 20,
            lastCommitDate: '03/01/2023',
            firstCommitDate: '02/22/2023',
          },
        ],
        joinedAt: '2022-05-28T15:13:30',
      }

      const member2 = {
        username: {
          [PlatformType.GITHUB]: 'michaelScott',
          [PlatformType.DISCORD]: 'michaelScott',
          [PlatformType.TWITTER]: 'michaelScott',
        },
        platform: PlatformType.GITHUB,
        emails: ['michael@mifflin.com'],
        score: 10,
        attributes: {
          aDateAttribute: {
            custom: '2022-08-06T00:00:00',
          },
          aMultiSelectAttribute: {
            custom: ['b', 'c'],
            github: ['b'],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
            [PlatformType.DISCORD]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/michael-scott',
            [PlatformType.TWITTER]: 'https://twitter.com/michael',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://website/michael',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Dunder & Mifflin Regional Manager',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Berlin',
          },
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.TWITTER]: '#twitterId2',
            [PlatformType.DISCORD]: '#discordId2',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.TWITTER]: 'https://twitter.com/michael/image',
          },
          aNumberAttribute: {
            [PlatformType.GITHUB]: 1500,
            [PlatformType.TWITTER]: 2500,
            [PlatformType.DISCORD]: 2,
          },
        },
        contributions: [
          {
            id: 112529472,
            url: 'https://github.com/bachman/pied-piper',
            topics: ['compression', 'data', 'middle-out', 'Java'],
            summary: 'Pied Piper: 10 commits in 1 day',
            numberCommits: 10,
            lastCommitDate: '2023-03-10',
            firstCommitDate: '2023-03-01',
          },
          {
            id: 112529473,
            url: 'https://github.com/bachman/aviato',
            topics: ['Python', 'Django'],
            summary: 'Aviato: 5 commits in 1 day',
            numberCommits: 5,
            lastCommitDate: '2023-02-25',
            firstCommitDate: '2023-02-20',
          },
          {
            id: 112529476,
            url: 'https://github.com/bachman/erlichbot',
            topics: ['Python', 'Slack API'],
            summary: 'ErlichBot: 2 commits in 1 day',
            numberCommits: 2,
            lastCommitDate: '2023-01-25',
            firstCommitDate: '2023-01-24',
          },
        ],
        joinedAt: '2022-09-15T15:13:30',
      }

      const member3 = {
        username: {
          [PlatformType.GITHUB]: 'jimHalpert',
          [PlatformType.DISCORD]: 'jimHalpert',
          [PlatformType.TWITTER]: 'jimHalpert',
        },
        platform: PlatformType.GITHUB,
        emails: ['jim@mifflin.com'],
        score: 10,
        attributes: {
          aDateAttribute: {
            custom: '2022-08-15T00:00:00',
          },
          aMultiSelectAttribute: {
            custom: ['a', 'c'],
            github: ['c'],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: false,
            [PlatformType.DISCORD]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/jim-halpert',
            [PlatformType.TWITTER]: 'https://twitter.com/jim',
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: 'https://website/jim',
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: 'Sales guy',
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: 'Scranton',
          },
          [MemberAttributeName.SOURCE_ID]: {
            [PlatformType.TWITTER]: '#twitterId3',
            [PlatformType.DISCORD]: '#discordId3',
          },
          [MemberAttributeName.AVATAR_URL]: {
            [PlatformType.TWITTER]: 'https://twitter.com/jim/image',
          },
          aNumberAttribute: {
            [PlatformType.GITHUB]: 15500,
            [PlatformType.TWITTER]: 25500,
            [PlatformType.DISCORD]: 200000,
          },
        },
        joinedAt: '2022-09-16T15:13:30Z',
      }

      const member1Created = await ms.upsert(member1)
      const member2Created = await ms.upsert(member2)
      const member3Created = await ms.upsert(member3)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      // filter and sort by aNumberAttribute default values
      let members = await ms.findAndCountAll({
        advancedFilter: {
          aNumberAttribute: {
            gte: 1000,
          },
        },
        orderBy: 'aNumberAttribute_DESC',
      })

      expect(members.count).toBe(2)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member3Created.id, member2Created.id])

      // filter and sort by aNumberAttribute platform specific values
      members = await ms.findAndCountAll({
        advancedFilter: {
          'attributes.aNumberAttribute.discord': {
            gte: 100000,
          },
        },
        orderBy: 'attributes.aNumberAttribute.discord_DESC',
      })

      expect(members.count).toBe(2)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member1Created.id, member3Created.id])

      // filter by isHireable default values
      members = await ms.findAndCountAll({
        advancedFilter: {
          isHireable: true,
        },
      })

      expect(members.count).toBe(1)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member2Created.id])

      // filter by isHireable platform specific values
      members = await ms.findAndCountAll({
        advancedFilter: {
          'attributes.isHireable.discord': true,
        },
      })

      expect(members.count).toBe(3)
      expect(members.rows.map((i) => i.id)).toStrictEqual([
        member3Created.id,
        member2Created.id,
        member1Created.id,
      ])

      // filter and sort by url default values
      members = await ms.findAndCountAll({
        advancedFilter: {
          url: {
            textContains: 'jim',
          },
        },
        orderBy: 'url_DESC',
      })

      expect(members.count).toBe(1)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member3Created.id])

      // filter and sort by url platform specific values
      members = await ms.findAndCountAll({
        advancedFilter: {
          'attributes.url.github': {
            textContains: 'github',
          },
        },
        orderBy: 'attributes.url.github_ASC',
      })

      expect(members.count).toBe(3)

      // results will be sorted by github.url anil -> jim -> michael
      expect(members.rows.map((i) => i.id)).toStrictEqual([
        member1Created.id,
        member3Created.id,
        member2Created.id,
      ])

      // filter and sort by custom aDateAttribute
      members = await ms.findAndCountAll({
        advancedFilter: {
          aDateAttribute: {
            lte: '2022-08-06T00:00:00',
          },
        },
        orderBy: 'aDateAttribute_DESC',
      })

      expect(members.count).toBe(2)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member2Created.id, member1Created.id])

      // filter by custom aMultiSelectAttribute
      members = await ms.findAndCountAll({
        advancedFilter: {
          aMultiSelectAttribute: {
            overlap: ['a'],
          },
        },
        orderBy: 'createdAt_DESC',
      })
      expect(members.count).toBe(2)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member3Created.id, member1Created.id])

      // filter by numberOfOpenSourceContributions
      members = await ms.findAndCountAll({
        filter: {
          numberOfOpenSourceContributionsRange: [2, 6],
        },
      })
      expect(members.count).toBe(2)
      expect(members.rows.map((i) => i.id)).toEqual([member2Created.id, member1Created.id])

      // filter by numberOfOpenSourceContributions only start
      members = await ms.findAndCountAll({
        filter: {
          numberOfOpenSourceContributionsRange: [3],
        },
      })
      expect(members.count).toBe(1)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member2Created.id])

      // filter and sort by numberOfOpenSourceContributions
      members = await ms.findAndCountAll({
        filter: {
          numberOfOpenSourceContributionsRange: [2, 6],
        },
        orderBy: 'numberOfOpenSourceContributions_ASC',
      })
      expect(members.count).toBe(2)
      expect(members.rows.map((i) => i.id)).toStrictEqual([member1Created.id, member2Created.id])

      // sort by numberOfOpenSourceContributions
      members = await ms.findAndCountAll({
        orderBy: 'numberOfOpenSourceContributions_ASC',
      })
      expect(members.count).toBe(3)
      expect(members.rows.map((i) => i.id)).toStrictEqual([
        member3Created.id,
        member1Created.id,
        member2Created.id,
      ])
    })
  })
})
