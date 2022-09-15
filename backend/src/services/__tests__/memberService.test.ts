import moment from 'moment'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import MemberService from '../memberService'
import MemberRepository from '../../database/repositories/memberRepository'
import ActivityRepository from '../../database/repositories/activityRepository'
import TagRepository from '../../database/repositories/tagRepository'
import Error404 from '../../errors/Error404'
import Error400 from '../../errors/Error400'
import { PlatformType } from '../../utils/platforms'
import OrganizationRepository from '../../database/repositories/organizationRepository'
import TaskRepository from '../../database/repositories/taskRepository'
import NoteRepository from '../../database/repositories/noteRepository'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import { GithubMemberAttributes } from '../../database/attributes/member/github'
import { MemberAttributeName } from '../../database/attributes/member/enums'
import { TwitterMemberAttributes } from '../../database/attributes/member/twitter'
import { DiscordMemberAttributes } from '../../database/attributes/member/discord'
import { DevtoMemberAttributes } from '../../database/attributes/member/devto'
import { AttributeType } from '../../database/attributes/types'
import { SlackMemberAttributes } from '../../database/attributes/member/slack'

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

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      await expect(() =>
        new MemberService(mockIServiceOptions).upsert(member1),
      ).rejects.toThrowError(new Error400())
    })

    it('Should create non existent member - string type username', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
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
          [platform]: username,
        },
        displayName: username,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - attributes with matching platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GithubMemberAttributes)
      await mas.createPredefined(TwitterMemberAttributes)
      await mas.createPredefined(DiscordMemberAttributes)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
          },
          [PlatformType.TWITTER]: {
            [MemberAttributeName.ID]: '#twitterId',
            [MemberAttributeName.IMAGE_URL]: 'https://some-image-url',
            [MemberAttributeName.URL]: 'https://some-url',
          },
          [PlatformType.DISCORD]: {
            [MemberAttributeName.ID]: '#discordId',
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
          [platform]: username,
        },
        displayName: username,
        attributes: {
          [MemberAttributeName.ID]: {
            [PlatformType.DISCORD]: attributes[PlatformType.DISCORD][MemberAttributeName.ID],
            [PlatformType.TWITTER]: attributes[PlatformType.TWITTER][MemberAttributeName.ID],
            default: attributes[PlatformType.TWITTER][MemberAttributeName.ID],
          },
          [MemberAttributeName.IMAGE_URL]: {
            [PlatformType.TWITTER]: attributes[PlatformType.TWITTER][MemberAttributeName.IMAGE_URL],
            default: attributes[PlatformType.TWITTER][MemberAttributeName.IMAGE_URL],
          },
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
            [PlatformType.TWITTER]: attributes[PlatformType.TWITTER][MemberAttributeName.URL],
            default: attributes[PlatformType.TWITTER][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should create non existent member - object type username', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.TWITTER]: 'anil_twitter',
        },
        platform: PlatformType.GITHUB,
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
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
        username,
        displayName: username[PlatformType.GITHUB],
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
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
        email: 'lala@l.com',
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
          [platform]: username,
        },
        displayName: username,
        attributes: {},
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
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
        email: 'lala@l.com',
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
          [platform]: username,
        },
        displayName: username,
        attributes: {},
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
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
        email: 'lala@l.com',
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
          [platform]: username,
        },
        displayName: username,
        attributes: {},
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 20, [PlatformType.DISCORD]: 10, [PlatformType.TWITTER]: 10 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - simple', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
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
        platform: PlatformType.GITHUB,
        location: 'Ankara',
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          [PlatformType.GITHUB]: member1Username,
        },
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        reach: { total: -1 },
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - attributes with matching platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GithubMemberAttributes)
      await mas.createPredefined(TwitterMemberAttributes)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
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
          [PlatformType.GITHUB]: {
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
          },
          [PlatformType.TWITTER]: {
            [MemberAttributeName.URL]: 'https://twitter-url',
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
          [PlatformType.GITHUB]: member1Username,
        },
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes1[PlatformType.GITHUB][MemberAttributeName.NAME],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]:
              attributes1[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes1[PlatformType.GITHUB][MemberAttributeName.URL],
            [PlatformType.TWITTER]: attributes2[PlatformType.TWITTER][MemberAttributeName.URL],
            default: attributes2[PlatformType.TWITTER][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]:
              attributes2[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes2[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes2[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes2[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes2[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes2[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
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

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
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
        username: member2.username,
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
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

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
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

      await mas.createPredefined(GithubMemberAttributes)
      await mas.createPredefined(DevtoMemberAttributes)

      const member1 = {
        username: 'anil',
        platform: PlatformType.TWITTER,
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
          },
        },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const member1Platform = member1.platform
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
          [PlatformType.DEVTO]: {
            [MemberAttributeName.ID]: '#someDevtoId',
            [MemberAttributeName.NAME]: 'Michael Scott',
            [MemberAttributeName.URL]: 'https://some-devto-url',
          },
          [PlatformType.SLACK]: {
            [MemberAttributeName.ID]: '#someSlackId',
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
          [PlatformType.TWITTER]: member1Username,
        },
        displayName: member1Username,
        attributes: {
          [MemberAttributeName.ID]: {
            [PlatformType.DEVTO]: attributes2[PlatformType.DEVTO][MemberAttributeName.ID],
            [PlatformType.SLACK]: attributes2[PlatformType.SLACK][MemberAttributeName.ID],
            default: attributes2[PlatformType.DEVTO][MemberAttributeName.ID],
          },
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: attributes1[PlatformType.GITHUB][MemberAttributeName.NAME],
            [PlatformType.DEVTO]: attributes2[PlatformType.DEVTO][MemberAttributeName.NAME],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.NAME],
          },
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]:
              attributes1[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.IS_HIREABLE],
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: attributes1[PlatformType.GITHUB][MemberAttributeName.URL],
            [PlatformType.DEVTO]: attributes2[PlatformType.DEVTO][MemberAttributeName.URL],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.URL],
          },
          [MemberAttributeName.WEBSITE_URL]: {
            [PlatformType.GITHUB]:
              attributes1[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.WEBSITE_URL],
          },
          [MemberAttributeName.BIO]: {
            [PlatformType.GITHUB]: attributes1[PlatformType.GITHUB][MemberAttributeName.BIO],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.BIO],
          },
          [MemberAttributeName.LOCATION]: {
            [PlatformType.GITHUB]: attributes1[PlatformType.GITHUB][MemberAttributeName.LOCATION],
            default: attributes1[PlatformType.GITHUB][MemberAttributeName.LOCATION],
          },
        },
        email: member1.email,
        score: member1.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: -1 },
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - null fields', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mas = new MemberAttributeSettingsService(mockIServiceOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const member1 = {
        username: 'anil',
        type: 'member',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: 'Quoc-Anh Nguyen',
            [MemberAttributeName.IS_HIREABLE]: true,
            [MemberAttributeName.URL]: 'https://github.com/imcvampire',
            [MemberAttributeName.WEBSITE_URL]: 'https://imcvampire.js.org/',
            [MemberAttributeName.BIO]: 'Lazy geek',
            [MemberAttributeName.LOCATION]: 'Helsinki, Finland',
          },
        },
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        location: null,
        attributes: {
          [PlatformType.GITHUB]: {
            [MemberAttributeName.NAME]: null,
            [MemberAttributeName.IS_HIREABLE]: null,
            [MemberAttributeName.URL]: null,
            [MemberAttributeName.WEBSITE_URL]: null,
            [MemberAttributeName.BIO]: null,
            [MemberAttributeName.LOCATION]: null,
          },
        },
      }

      // First null values will throw 400 error because attribute typechecks will fail
      await expect(() =>
        new MemberService(mockIServiceOptions).upsert(member2),
      ).rejects.toThrowError(
        new Error400(
          mockIServiceOptions.language,
          'settings.memberAttributes.wrongType',
          MemberAttributeName.NAME,
          AttributeType.STRING,
        ),
      )
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
          [PlatformType.GITHUB]: member1Username,
        },
        displayName: member1Username,
        reach: { total: 10, [PlatformType.GITHUB]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        email: null,
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
          [PlatformType.GITHUB]: member1Username,
        },
        displayName: member1Username,
        reach: { total: 10, [PlatformType.GITHUB]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        email: null,
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
          [PlatformType.GITHUB]: member1Username,
        },
        displayName: member1Username,
        reach: { total: 36, [PlatformType.GITHUB]: 15, linkedin: 11, [PlatformType.TWITTER]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        email: null,
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
          [PlatformType.GITHUB]: member1Username,
        },
        displayName: member1Username,
        reach: { total: 50, [PlatformType.GITHUB]: 30, linkedin: 10, [PlatformType.TWITTER]: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        email: null,
        attributes: {},
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })
  })

  describe('merge method', () => {
    it('Should merge', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)
      await mas.createPredefined(DiscordMemberAttributes)
      await mas.createPredefined(TwitterMemberAttributes)
      await mas.createPredefined(SlackMemberAttributes)

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
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
        tags: [t1.id, t2.id],
        organizations: [o1.id, o2.id],
        tasks: [task1.id, task2.id],
        notes: [note1.id, note2.id],
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Michael Scott',
            default: 'Michael Scott',
          },
          [MemberAttributeName.COMPANY]: {
            [PlatformType.GITHUB]: 'Crowd.dev',
            default: 'Crowd.dev',
          },
          [MemberAttributeName.ID]: {
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
          slack: 'testt',
        },
        displayName: 'Member 4',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.ID]: {
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
        isKeyAction: true,
        member: returnedMember2.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // toMerge[1] = [(1,2),(1,4)] toMerge[2] = [(2,1)] toMerge[4] = [(4,1)]
      // noMerge[2] = [3]
      await MemberRepository.addToMerge(
        returnedMember1.id,
        returnedMember2.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        returnedMember1.id,
        returnedMember4.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        returnedMember2.id,
        returnedMember1.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        returnedMember4.id,
        returnedMember1.id,
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
      activityCreated = SequelizeTestUtils.objectWithoutKey(activityCreated, 'member')

      // we don't need activity.parent because it is 2 level deep (member->activity->parent)
      activityCreated = SequelizeTestUtils.objectWithoutKey(activityCreated, 'parent')

      // we don't need activity.tasks because it is 2 level deep (member->activity->tasks)
      activityCreated = SequelizeTestUtils.objectWithoutKey(activityCreated, 'tasks')

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
      o1 = SequelizeTestUtils.objectWithoutKey(o1, 'memberCount')
      o2 = SequelizeTestUtils.objectWithoutKey(o2, 'memberCount')
      o3 = SequelizeTestUtils.objectWithoutKey(o3, 'memberCount')

      // remove tasks->member and tasks->activity relations as well (we should be only checking 1-deep relations)
      task1 = SequelizeTestUtils.objectWithoutKey(task1, 'members')
      task1 = SequelizeTestUtils.objectWithoutKey(task1, 'activities')
      task2 = SequelizeTestUtils.objectWithoutKey(task2, 'members')
      task2 = SequelizeTestUtils.objectWithoutKey(task2, 'activities')
      task3 = SequelizeTestUtils.objectWithoutKey(task3, 'members')
      task3 = SequelizeTestUtils.objectWithoutKey(task3, 'activities')

      // remove notes->member relations as well (we should be only checking 1-deep relations)
      note1 = SequelizeTestUtils.objectWithoutKey(note1, 'members')
      note2 = SequelizeTestUtils.objectWithoutKey(note2, 'members')
      note3 = SequelizeTestUtils.objectWithoutKey(note3, 'members')

      mergedMember.updatedAt = mergedMember.updatedAt.toISOString().split('T')[0]

      const expectedMember = {
        id: returnedMember1.id,
        username: {
          [PlatformType.GITHUB]: member1.username.github,
          [PlatformType.DISCORD]: member2.username.discord,
        },
        displayName: member1.displayName,
        activities: [activityCreated],
        attributes: {
          ...member1.attributes,
          ...member2.attributes,
        },
        email: null,
        score: -1,
        importHash: null,
        createdAt: returnedMember1.createdAt,
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        joinedAt: new Date(member1.joinedAt),
        reach: { total: -1 },
        tags: [t1, t2, t3],
        tasks: [task1, task2, task3],
        notes: [note1, note2, note3],
        organizations: [o1, o2, o3],
        noMerge: [returnedMember3.id],
        toMerge: [returnedMember4.id],
      }

      expect(mergedMember).toStrictEqual(expectedMember)
    })

    it('Should catch when two members are the same', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      const memberCreated = await MemberRepository.create(member1, mockIRepositoryOptions)
      const mergeOutput = await memberService.merge(memberCreated.id, memberCreated.id)

      expect(mergeOutput).toStrictEqual({ status: 203, mergedId: memberCreated.id })

      const found = await memberService.findById(memberCreated.id)
      expect(found).toStrictEqual(memberCreated)
    })

    it('Should not duplicate activities - by timestamp', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      const createdMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const a1 = {
        timestamp: '2021-05-27T15:14:30Z',
        type: 'activity',
        member: createdMember.id,
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      const aRepeated = {
        timestamp: '2021-06-27T15:14:30Z',
        type: 'activity',
        member: createdMember.id,
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      const a1Created = await ActivityRepository.create(a1, mockIRepositoryOptions)

      const aCreatedRepeated1 = await ActivityRepository.create(aRepeated, mockIRepositoryOptions)

      const member2 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
      }

      const createdMember2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      aRepeated.member = createdMember2.id
      aRepeated.sourceId = '#sourceId2'

      await ActivityRepository.create(aRepeated, mockIRepositoryOptions)

      const a3Created = await ActivityRepository.create(
        {
          timestamp: '2019-12-27T15:14:30Z',
          type: 'activity',
          member: createdMember2.id,
          platform: PlatformType.GITHUB,
          sourceId: '#sourceId3',
        },
        mockIRepositoryOptions,
      )

      const foundActivities = await ActivityRepository.findAndCountAll(
        {
          filter: {
            timestamp: aRepeated.timestamp,
            type: aRepeated.type,
            platform: aRepeated.platform,
          },
        },
        mockIRepositoryOptions,
      )

      // Making sure the activity is indeed repeated
      expect({
        timestamp: foundActivities.rows[0].timestamp,
        type: foundActivities.rows[0].type,
        platform: foundActivities.rows[0].platform,
      }).toStrictEqual({
        timestamp: foundActivities.rows[1].timestamp,
        type: foundActivities.rows[1].type,
        platform: foundActivities.rows[1].platform,
      })

      // Merge
      await memberService.merge(createdMember.id, createdMember2.id)

      const foundMergedActivities = (await memberService.findById(createdMember.id)).activities
        .map((a) => a.get({ plain: true }).id)
        .sort()

      const expected = [aCreatedRepeated1.id, a1Created.id, a3Created.id].sort()
      expect(foundMergedActivities).toStrictEqual(expected)
    })

    it('Duplication of activities - one matching timestamp is duplicated because platform is different', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      const createdMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const a1 = {
        timestamp: moment(0).utc().toString(),
        type: 'activity',
        member: createdMember.id,
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      const aRepeated = {
        timestamp: '2021-06-27T15:14:30Z',
        type: 'activity',
        member: createdMember.id,
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId2',
      }

      const a1Created = await ActivityRepository.create(a1, mockIRepositoryOptions)

      const aCreatedRepeated1 = await ActivityRepository.create(aRepeated, mockIRepositoryOptions)

      const member2 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
      }

      const createdMember2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      aRepeated.member = createdMember2.id

      await ActivityRepository.create(aRepeated, mockIRepositoryOptions)

      const aSameTsDifferentType = await ActivityRepository.create(
        {
          timestamp: moment(0).utc().toString(),
          type: 'activity',
          member: createdMember2.id,
          platform: 'different',
          sourceId: '#sourceId3',
        },
        mockIRepositoryOptions,
      )

      // Merge
      await memberService.merge(createdMember.id, createdMember2.id)

      const foundMergedActivities = (await memberService.findById(createdMember.id)).activities
        .map((a) => a.get({ plain: true }).id)
        .sort()

      const expected = [aCreatedRepeated1.id, a1Created.id, aSameTsDifferentType.id].sort()
      expect(foundMergedActivities).toStrictEqual(expected)
    })
  })

  describe('addToNoMerge method', () => {
    it('Should add two members to their respective noMerges, these members should be excluded from toMerges respectively', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)
      await mas.createPredefined(TwitterMemberAttributes)
      await mas.createPredefined(DiscordMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-30T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Michael Scott',
            default: 'Michael Scott',
          },
          [MemberAttributeName.ID]: {
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
        returnedMember1.id,
        returnedMember2.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        returnedMember2.id,
        returnedMember1.id,
        mockIRepositoryOptions,
      )

      await MemberRepository.addToMerge(
        returnedMember1.id,
        returnedMember3.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        returnedMember3.id,
        returnedMember1.id,
        mockIRepositoryOptions,
      )

      await MemberRepository.addToMerge(
        returnedMember2.id,
        returnedMember3.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        returnedMember3.id,
        returnedMember2.id,
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

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
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

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      const returnedMember1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      delete returnedMember1.toMerge
      delete returnedMember1.noMerge
      delete returnedMember1.tags
      delete returnedMember1.activities
      delete returnedMember1.organizations
      delete returnedMember1.tasks
      delete returnedMember1.notes

      const existing = await memberService.memberExists(
        member1.username[PlatformType.GITHUB],
        PlatformType.GITHUB,
      )

      expect(existing).toStrictEqual(returnedMember1)
    })

    it('Should return null if member is not found - string type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      const existing = await memberService.memberExists('some-random-username', PlatformType.GITHUB)

      expect(existing).toBeNull()
    })

    it('Should return null if member is not found - object type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
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

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.DISCORD]: 'some-other-username',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
      }

      const returnedMember1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      delete returnedMember1.toMerge
      delete returnedMember1.noMerge
      delete returnedMember1.tags
      delete returnedMember1.activities
      delete returnedMember1.organizations
      delete returnedMember1.tasks
      delete returnedMember1.notes

      const existing = await memberService.memberExists(
        { [PlatformType.DISCORD]: 'some-other-username' },
        PlatformType.DISCORD,
      )

      expect(returnedMember1).toStrictEqual(existing)
    })

    it('Should throw 400 error when username is type of object and username[platform] is not present ', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(GithubMemberAttributes)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          [PlatformType.GITHUB]: 'anil',
          [PlatformType.DISCORD]: 'some-other-username',
        },
        displayName: 'Anil',
        joinedAt: '2021-05-27T15:14:30Z',
        attributes: {
          [MemberAttributeName.NAME]: {
            [PlatformType.GITHUB]: 'Quoc-Anh Nguyen',
            default: 'Quoc-Anh Nguyen',
          },
        },
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
})
