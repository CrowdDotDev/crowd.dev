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

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      await expect(() =>
        new MemberService(mockIServiceOptions).upsert(member1),
      ).rejects.toThrowError(new Error400())
    })

    it('Should create non existent member - string type username', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        email: 'lala@l.com',
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
        },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform } = member1
      const { username } = member1
      const { crowdInfo } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: username,
          [platform]: username,
        },
        crowdInfo: { [platform]: crowdInfo },
        attributes: {},
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
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

    it('Should create non existent member - crowdInfo with matching platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        email: 'lala@l.com',
        score: 10,
        crowdInfo: {
          github: {
            name: 'Quoc-Anh Nguyen',
            isHireable: true,
            url: 'https://github.com/imcvampire',
            websiteUrl: 'https://imcvampire.js.org/',
            bio: 'Lazy geek',
            location: 'Helsinki, Finland',
            actions: [
              {
                score: 2,
                timestamp: '2021-05-27T15:13:30Z',
              },
            ],
          },
          twitter: {
            followers: 5,
            following: 10,
          },
          discord: {
            someDiscordField: 'test',
          },
        },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform } = member1
      const { username } = member1
      const { crowdInfo } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: username,
          [platform]: username,
        },
        attributes: {},
        crowdInfo,
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
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

      const member1 = {
        username: {
          github: 'anil',
          twitter: 'anil_twitter',
        },
        platform: PlatformType.GITHUB,
        email: 'lala@l.com',
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
        },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { username } = member1
      const { platform } = member1
      const { crowdInfo } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: username,
          ...member1.username,
        },
        attributes: {},
        crowdInfo: { [platform]: crowdInfo },
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
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
        crowdInfo: {},
        reach: 10,
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform } = member1
      const { username } = member1
      const { crowdInfo } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: username,
          [platform]: username,
        },
        crowdInfo: { [platform]: crowdInfo },
        attributes: {},
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 10, github: 10 },
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
        crowdInfo: {},
        reach: { github: 10, twitter: 10 },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
      }

      // Save some attributes since they get modified in the upsert function
      const { platform } = member1
      const { username } = member1
      const { crowdInfo } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: username,
          [platform]: username,
        },
        crowdInfo: { [platform]: crowdInfo },
        attributes: {},
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 20, github: 10, twitter: 10 },
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
        crowdInfo: {},
        reach: { discord: 10, twitter: 10 },
        bio: 'Computer Science',
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Istanbul',
        }

      // Save some attributes since they get modified in the upsert function
      const { platform } = member1
      const { username } = member1
      const { crowdInfo } = member1

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: username,
          [platform]: username,
        },
        crowdInfo: { [platform]: crowdInfo },
        attributes: {},
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        reach: { total: 20, discord: 10, twitter: 10 },
        joinedAt: new Date('2020-05-28T15:13:30Z'),
      }

      expect(memberCreated).toStrictEqual(memberExpected)
    })

    it('Should update existent member succesfully - simple', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const member1CrowdInfo = member1.crowdInfo

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
          crowdUsername: member1Username,
          github: member1Username,
        },
        attributes: {},
        crowdInfo: { github: member1CrowdInfo },
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member2.location,
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

    it('Should update existent member succesfully - crowdInfo with matching platform', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        crowdInfo: {
          github: {
            name: 'Quoc-Anh Nguyen',
            isHireable: true,
            url: 'https://github.com/imcvampire',
            websiteUrl: 'https://imcvampire.js.org/',
            bio: 'Lazy geek',
            location: 'Helsinki, Finland',
            actions: [
              {
                score: 2,
                timestamp: '2021-05-27T15:13:30Z',
              },
            ],
          },
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const member1CrowdInfo = member1.crowdInfo

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        location: 'Ankara',
        crowdInfo: {
          github: {
            someNewField: 'test',
            someOtherNewField: 'test2',
          },
          twitter: {
            someTwitterNewField: 'test3',
          },
        },
      }

      const member2CrowdInfo = member2.crowdInfo

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: member1Username,
          github: member1Username,
        },
        attributes: {},
        crowdInfo: {
          github: {
            ...member1CrowdInfo.github,
            ...member2CrowdInfo.github,
          },
          twitter: member2CrowdInfo.twitter,
        },
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member2.location,
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

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Username = member1.username
      const member1CrowdInfo = member1.crowdInfo
      const member1Platform = member1.platform

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: {
          github: 'anil',
          twitter: 'anil_twitter',
          discord: 'anil_discord',
        },
        platform: PlatformType.GITHUB,
        location: 'Ankara',
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        username: {
          crowdUsername: member1Username,
          ...member2.username,
        },
        attributes: {},
        crowdInfo: { [member1Platform]: member1CrowdInfo },
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member2.location,
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

      const member1 = {
        username: 'anil',
        email: 'lala@l.com',
        platform: PlatformType.GITHUB,
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: {
          github: 'anil',
          twitter: 'anil_twitter',
          discord: 'anil_discord',
        },
        platform: PlatformType.SLACK,
        location: 'Ankara',
      }

      await expect(() =>
        new MemberService(mockIServiceOptions).upsert(member2),
      ).rejects.toThrowError(new Error400())
    })

    it('Should update existent member succesfully - JSON fields', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const member1 = {
        username: 'anil',
        platform: PlatformType.TWITTER,
        email: 'lala@l.com',
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
          followers: 10,
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        joinedAt: '2020-05-28T15:13:30Z',
        attributes: {
          level1: {
            test_metric_1: 1,
            level2: {
              test_metric_2_1: 22,
              test_metric_2_2: 30,
              level3: {
                test_metric_3: 10,
                level4: {
                  test_metric_4: 40,
                },
              },
            },
          },
        },
      }

      const member1Username = member1.username
      const member1Platform = member1.platform
      const member1CrowdInfo = member1.crowdInfo

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.TWITTER,
        joinedAt: '2020-05-28T15:13:30Z',
        location: 'Ankara',
        crowdInfo: {
          followers: 20,
          following: 10,
        },
        attributes: {
          level1: {
            level2: {
              test_metric_2_2: '30',
              test_metric_2_3: 120,
              level3: {
                level4: {
                  test_metric_4: 90,
                  level5: {
                    test_metric_5: 100,
                  },
                },
              },
            },
          },
        },
      }

      const member2CrowdInfo = member2.crowdInfo

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          crowdUsername: member1Username,
          twitter: member1Username,
        },
        attributes: {
          level1: {
            test_metric_1: 1,
            level2: {
              test_metric_2_1: 22,
              test_metric_2_2: '30',
              test_metric_2_3: 120,
              level3: {
                test_metric_3: 10,
                level4: {
                  test_metric_4: 90,
                  level5: {
                    test_metric_5: 100,
                  },
                },
              },
            },
          },
        },
        crowdInfo: {
          [member1Platform]: {
            ...member1CrowdInfo,
            ...member2CrowdInfo,
          },
        },
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member2.location,
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

      const member1 = {
        username: 'anil',
        type: 'member',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-28T15:13:30Z',
        email: 'lala@l.com',
        score: 10,
        crowdInfo: {
          name: 'Quoc-Anh Nguyen',
          isHireable: true,
          url: 'https://github.com/imcvampire',
          websiteUrl: 'https://imcvampire.js.org/',
          bio: 'Lazy geek',
          location: 'Helsinki, Finland',
          actions: [
            {
              score: 2,
              timestamp: '2021-05-27T15:13:30Z',
            },
          ],
          followers: 10,
        },
        bio: 'Computer Science',
        location: 'Istanbul',
        attributes: {
          level1: {
            test_metric_1: 1,
            level2: {
              test_metric_2_1: 22,
              test_metric_2_2: 30,
              level3: {
                test_metric_3: 10,
                level4: {
                  test_metric_4: 40,
                },
              },
            },
          },
        },
      }

      const member1Username = member1.username
      const member1CrowdInfo = member1.crowdInfo
      const member1Platform = member1.platform

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        location: null,
        crowdInfo: {},
        attributes: {
          level1: null,
        },
      }

      const member2CrowdInfo = member2.crowdInfo

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          crowdUsername: member1Username,
          github: member1Username,
        },
        crowdInfo: {
          [member1Platform]: {
            ...member1CrowdInfo,
            ...member2CrowdInfo,
          },
        },
        attributes: {
          level1: {
            test_metric_1: 1,
            level2: {
              test_metric_2_1: 22,
              test_metric_2_2: 30,
              level3: {
                test_metric_3: 10,
                level4: {
                  test_metric_4: 40,
                },
              },
            },
          },
        },
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        location: member1.location,
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
          crowdUsername: member1Username,
          github: member1Username,
        },
        reach: { total: 10, github: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        crowdInfo: {},
        bio: null,
        location: null,
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
        reach: { github: 10 },
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          crowdUsername: member1Username,
          github: member1Username,
        },
        reach: { total: 10, github: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        crowdInfo: {},
        bio: null,
        location: null,
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
        reach: { twitter: 10, linkedin: 10, total: 20 },
      }

      const member1Username = member1.username

      const memberCreated = await new MemberService(mockIServiceOptions).upsert(member1)

      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const member2 = {
        username: 'anil',
        platform: PlatformType.GITHUB,
        reach: { github: 15, linkedin: 11 },
      }

      const memberUpdated = await new MemberService(mockIServiceOptions).upsert(member2)

      memberUpdated.createdAt = memberUpdated.createdAt.toISOString().split('T')[0]
      memberUpdated.updatedAt = memberUpdated.updatedAt.toISOString().split('T')[0]

      const memberExpected = {
        id: memberCreated.id,
        joinedAt: new Date('2020-05-28T15:13:30Z'),
        username: {
          crowdUsername: member1Username,
          github: member1Username,
        },
        reach: { total: 36, github: 15, linkedin: 11, twitter: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        crowdInfo: {},
        bio: null,
        location: null,
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
        reach: { twitter: 10, linkedin: 10, total: 20 },
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
          crowdUsername: member1Username,
          github: member1Username,
        },
        reach: { total: 50, github: 30, linkedin: 10, twitter: 10 },
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIServiceOptions.currentTenant.id,
        createdById: mockIServiceOptions.currentUser.id,
        updatedById: mockIServiceOptions.currentUser.id,
        score: -1,
        crowdInfo: {},
        bio: null,
        location: null,
        email: null,
        attributes: {},
      }

      expect(memberUpdated).toStrictEqual(memberExpected)
    })
  })

  describe('merge method', () => {
    it('Should merge', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

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
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
          },
        },
        tags: [t1.id, t2.id],
        organizations: [o1.id, o2.id],
        tasks: [task1.id, task2.id],
        notes: [note1.id, note2.id],
      }

      const member2 = {
        username: {
          crowdUsername: 'anil2',
          discord: 'anil',
        },
        joinedAt: '2021-05-30T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test_2',
          },
          discord: {
            info: 'discord_test',
          },
        },
        tags: [t2.id, t3.id],
        organizations: [o2.id, o3.id],
        tasks: [task2.id, task3.id],
        notes: [note2.id, note3.id],
      }

      const member3 = {
        username: {
          crowdUsername: 'anil3',
          twitter: 'anil',
        },
        joinedAt: '2021-05-30T15:14:30Z',
        crowdInfo: {
          twitter: {
            info: 'twitter_test',
          },
        },
      }
      const member4 = {
        username: {
          crowdUsername: 'anil4',
          slack: 'testt',
        },
        joinedAt: '2021-05-30T15:14:30Z',
        crowdInfo: {
          slack: {
            channel: 'test',
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
        crowdInfo: {
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
          crowdUsername: member1.username.crowdUsername,
          github: member1.username.github,
          discord: member2.username.discord,
        },
        activities: [activityCreated],
        crowdInfo: {
          ...member1.crowdInfo,
          ...member2.crowdInfo,
        },
        email: null,
        score: -1,
        bio: null,
        location: null,
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
        attributes:{}
      }

      expect(mergedMember).toStrictEqual(expectedMember)
    })

    it('Should catch when two members are the same', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
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

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
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
          crowdUsername: 'anil2',
          github: 'anil',
        },
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

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
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
          crowdUsername: 'anil2',
          github: 'anil',
        },
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

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
          },
        },
      }

      const member2 = {
        username: {
          crowdUsername: 'anil2',
          discord: 'anil',
        },
        joinedAt: '2021-05-30T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test_2',
          },
          discord: {
            info: 'discord_test',
          },
        },
      }

      const member3 = {
        username: {
          crowdUsername: 'anil3',
          twitter: 'anil',
        },
        joinedAt: '2021-05-30T15:14:30Z',
        crowdInfo: {
          twitter: {
            info: 'twitter_test',
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

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
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

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
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
        member1.username.crowdUsername,
        'crowdUsername',
      )

      expect(existing).toStrictEqual(returnedMember1)
    })

    it('Should return null if member is not found - string type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
          },
        },
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      const existing = await memberService.memberExists('some-random-username', 'crowdUsername')

      expect(existing).toBeNull()
    })

    it('Should return null if member is not found - object type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          crowdUsername: 'anil1',
          github: 'anil',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
          },
        },
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      const existing = await memberService.memberExists(
        {
          ...member1.username,
          slack: 'some-slack-username',
        },
        PlatformType.SLACK,
      )

      expect(existing).toBeNull()
    })

    it('Should find existing member with object username and given platform', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          github: 'anil',
          discord: 'some-other-username',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
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
        { discord: 'some-other-username' },
        PlatformType.DISCORD,
      )

      expect(returnedMember1).toStrictEqual(existing)
    })

    it('Should throw 400 error when username is type of object and username[platform] is not present ', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberService = new MemberService(mockIRepositoryOptions)

      const member1 = {
        username: {
          github: 'anil',
          discord: 'some-other-username',
        },
        joinedAt: '2021-05-27T15:14:30Z',
        crowdInfo: {
          github: {
            info: 'github_test',
          },
        },
      }

      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        memberService.memberExists({ discord: 'some-other-username' }, 'slack'),
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
      const newReach = { twitter: 10 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 10,
        twitter: 10,
      })
    })
    it('Should update for a new reach and old reach in the same platform', async () => {
      const oldReach = { twitter: 5, total: 5 }
      const newReach = { twitter: 10 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 10,
        twitter: 10,
      })
    })
    it('Should update for a complex reach with different platforms', async () => {
      const oldReach = { twitter: 10, github: 20, discord: 50, total: 10 + 20 + 50 }
      const newReach = { twitter: 20, github: 2, linkedin: 10, total: 20 + 2 + 10 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 10 + 20 + 2 + 50,
        twitter: 20,
        github: 2,
        linkedin: 10,
        discord: 50,
      })
    })
    it('Should work with reach 0', async () => {
      const oldReach = { total: -1 }
      const newReach = { twitter: 0 }
      const updatedReach = MemberService.calculateReach(oldReach, newReach)
      expect(updatedReach).toStrictEqual({
        total: 0,
        twitter: 0,
      })
    })
  })
})
