import MemberRepository from '../memberRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import TagRepository from '../tagRepository'
import { PlatformType } from '../../../utils/platforms'

const db = null

describe('MemberRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create the given member succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          crowdUsername: 'anil',
          github: 'anil_github',
        },
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
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        bio: 'Computer Science',
        organisation: 'Crowd',
        location: 'Istanbul',
        signals: 'testSignal',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(
        member2add,
        mockIRepositoryOptions,
      )

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: member2add.username,
        type: memberCreated.type,
        info: {},
        crowdInfo: member2add.crowdInfo,
        email: member2add.email,
        score: member2add.score,
        bio: member2add.bio,
        organisation: member2add.organisation,
        location: member2add.location,
        signals: member2add.signals,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },

        joinedAt: new Date('2020-05-27T15:13:30Z'),
        tags: [],
        noMerge: [],
        toMerge: [],
      }
      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should create succesfully but return without relations when doPupulateRelations=false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          crowdUsername: 'anil',
          github: 'anil_github',
        },
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
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        bio: 'Computer Science',
        organisation: 'Crowd',
        location: 'Istanbul',
        signals: 'testSignal',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(
        member2add,
        mockIRepositoryOptions,
        false,
      )

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: member2add.username,
        type: memberCreated.type,
        info: {},
        crowdInfo: member2add.crowdInfo,
        email: member2add.email,
        score: member2add.score,
        bio: member2add.bio,
        organisation: member2add.organisation,
        location: member2add.location,
        signals: member2add.signals,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),
      }
      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should succesfully create member with only mandatory username and joinedAt fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(
        member2add,
        mockIRepositoryOptions,
      )

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: member2add.username,
        type: memberCreated.type,
        info: {},
        crowdInfo: {},
        email: null,
        score: -1,
        bio: null,
        organisation: null,
        location: null,
        signals: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),

        tags: [],
        noMerge: [],
        toMerge: [],
      }

      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should throw error when no username given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // no username field, should reject the promise with
      // sequelize unique constraint
      const member2add = {
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'test@crowd.dev',
      }

      await expect(() =>
        MemberRepository.create(member2add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should throw error when no joinedAt given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // no username field, should reject the promise with
      // sequelize unique constraint
      const member2add = {
        username: { crowdUsername: 'anil' },
        email: 'test@crowd.dev',
      }

      await expect(() =>
        MemberRepository.create(member2add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created member by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(
        member2add,
        mockIRepositoryOptions,
      )

      const expectedMemberFound = {
        id: memberCreated.id,
        type: memberCreated.type,
        username: member2add.username,
        info: {},
        crowdInfo: {},
        email: null,
        score: -1,
        bio: null,
        organisation: null,
        location: null,
        signals: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },

        joinedAt: new Date('2020-05-27T15:13:30Z'),
        tags: [],
        noMerge: [],
        toMerge: [],
      }

      const memberById = await MemberRepository.findById(
        memberCreated.id,
        mockIRepositoryOptions,
      )

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberById.createdAt = memberById.createdAt.toISOString().split('T')[0]
      memberById.updatedAt = memberById.updatedAt.toISOString().split('T')[0]

      expect(memberById).toStrictEqual(expectedMemberFound)
    })

    it('Should return a plain object when called with doPupulateRelations false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(
        member2add,
        mockIRepositoryOptions,
      )

      const expectedMemberFound = {
        id: memberCreated.id,
        type: memberCreated.type,
        username: member2add.username,
        info: {},
        crowdInfo: {},
        email: null,
        score: -1,
        bio: null,
        organisation: null,
        location: null,
        signals: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),
      }

      const memberById = await MemberRepository.findById(
        memberCreated.id,
        mockIRepositoryOptions,
        true,
        false,
      )

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberById.createdAt = memberById.createdAt.toISOString().split('T')[0]
      memberById.updatedAt = memberById.updatedAt.toISOString().split('T')[0]

      expect(memberById).toStrictEqual(expectedMemberFound)
    })

    it('Should throw 404 error when no member found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        MemberRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created member entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
      }
      const member2 = {
        username: { crowdUsername: 'test2' },
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )
      const member2Returned = await MemberRepository.create(
        member2,
        mockIRepositoryOptions,
      )

      const filterIdsReturned = await MemberRepository.filterIdsInTenant(
        [member1Returned.id, member2Returned.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([member1Returned.id, member2Returned.id])
    })

    it('Should only return the ids of previously created members and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test3' },
        joinedAt: '2020-05-29T15:14:30Z',
      }

      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await MemberRepository.filterIdsInTenant(
        [member1Returned.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([member1Returned.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test3' },
        joinedAt: '2020-04-29T15:14:30Z',
      }

      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await MemberRepository.filterIdsInTenant(
        [member1Returned.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('findOne method', () => {
    it('Should return the created member for a simple query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )

      const found = await MemberRepository.findOne(
        { email: 'joan@crowd.dev' },
        mockIRepositoryOptions,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should  return a plain object when doPupulateRelations is false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )
      delete member1Returned.toMerge
      delete member1Returned.noMerge
      delete member1Returned.tags
      delete member1Returned.activities

      const found = await MemberRepository.findOne(
        { email: 'joan@crowd.dev' },
        mockIRepositoryOptions,
        false,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should return the member for a complex query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )

      const found = await MemberRepository.findOne(
        { 'username.crowdUsername': 'test1' },
        mockIRepositoryOptions,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should throw an error when non-existent', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        MemberRepository.findOne(
          { 'username.crowdUsername': 'test2' },
          mockIRepositoryOptions,
        ),
      )
    })
  })

  describe('memberExists method', () => {
    it('Should return the created member for a simple query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )

      const found = await MemberRepository.memberExists(
        'test1',
        'crowdUsername',
        mockIRepositoryOptions,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should a plain object when called with doPupulateRelations false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(
        member1,
        mockIRepositoryOptions,
      )
      delete member1Returned.toMerge
      delete member1Returned.noMerge
      delete member1Returned.tags
      delete member1Returned.activities

      const found = await MemberRepository.memberExists(
        'test1',
        'crowdUsername',
        mockIRepositoryOptions,
        false,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should return null when non-existent at platform level', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        MemberRepository.memberExists(
          'test1',
          PlatformType.GITHUB,
          mockIRepositoryOptions,
        ),
      )
    })

    it('Should return null when non-existent at username level', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        MemberRepository.memberExists('test2', 'crowdInfo', mockIRepositoryOptions),
      )
    })
  })

  describe('findAndCountAll method', () => {
    it('is successfully finding and counting all members, sortedBy activitiesCount DESC', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test1' },
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      const member2 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test2' },
          score: '6',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      const member3 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test3' },
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await mockIRepositoryOptions.database.activity.bulkCreate([
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member1.id,
          sourceId: '#sourceId1',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member2.id,
          sourceId: '#sourceId2',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member2.id,
          sourceId: '#sourceId3',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId4',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId5',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId6',
        },
      ])

      const members = await MemberRepository.findAndCountAll(
        { filter: {}, orderBy: 'activitiesCount_DESC' },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].activitiesCount).toEqual('3')
      expect(members.rows[1].activitiesCount).toEqual('2')
      expect(members.rows[2].activitiesCount).toEqual('1')
    })

    it('is successfully finding and counting all members, and tags [nodejs, vuejs]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })

      await MemberRepository.create(
        {
          username: { crowdUsername: 'test1' },
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { crowdUsername: 'test2' },
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { crowdUsername: 'test3' },
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      const members = await MemberRepository.findAndCountAll(
        { filter: { tags: [nodeTag.id, vueTag.id] } },
        mockIRepositoryOptions,
      )
      const member2 = members.rows.find((m) => m.username.crowdUsername === 'test2')
      expect(members.rows.length).toEqual(1)
      expect(member2.tags[0].name).toEqual('nodejs')
      expect(member2.tags[1].name).toEqual('vuejs')
    })

    it('is successfully finding and counting all members, and tags [nodejs]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })

      await MemberRepository.create(
        {
          username: { crowdUsername: 'test1' },
          score: '1',
          joinedAt: new Date(),
          tags: [nodeTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { crowdUsername: 'test2' },
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { crowdUsername: 'test3' },
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      const members = await MemberRepository.findAndCountAll(
        { filter: { tags: [nodeTag.id] } },
        mockIRepositoryOptions,
      )
      const member1 = members.rows.find((m) => m.username.crowdUsername === 'test1')
      const member2 = members.rows.find((m) => m.username.crowdUsername === 'test2')

      expect(members.rows.length).toEqual(2)
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member2.tags[1].name).toEqual('vuejs')
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 1 and less or equal to 6', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: { crowdUsername: 'test1' },
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: { crowdUsername: 'test2' },
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: { crowdUsername: 'test3' },
        score: '7',
        joinedAt: new Date(),
      }
      await MemberRepository.create(user1, mockIRepositoryOptions)
      await MemberRepository.create(user2, mockIRepositoryOptions)
      await MemberRepository.create(user3, mockIRepositoryOptions)

      const members = await MemberRepository.findAndCountAll(
        { filter: { scoreRange: [1, 6] } },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows.find((m) => m.username.crowdUsername === 'test1').score).toEqual(1)
      expect(members.rows.find((m) => m.username.crowdUsername === 'test2').score).toEqual(6)
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 7', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: { crowdUsername: 'test1' },
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: { crowdUsername: 'test2' },
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: { crowdUsername: 'test3' },
        score: '7',
        joinedAt: new Date(),
      }
      await MemberRepository.create(user1, mockIRepositoryOptions)
      await MemberRepository.create(user2, mockIRepositoryOptions)
      await MemberRepository.create(user3, mockIRepositoryOptions)

      const members = await MemberRepository.findAndCountAll(
        { filter: { scoreRange: [7] } },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(1)
      for (const member of members.rows) {
        expect(member.score).toBeGreaterThanOrEqual(7)
      }
    })

    it('is successfully find and counting members, with computed attributes, and full options (filter, limit, offset and orderBy)', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })

      const member1 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test1' },
          score: '1',
          joinedAt: new Date(),
          tags: [nodeTag.id],
        },
        mockIRepositoryOptions,
      )
      const member2 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test2' },
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      const member3 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test3' },
          score: '7',
          joinedAt: new Date(),
          tags: [vueTag.id],
        },
        mockIRepositoryOptions,
      )

      await mockIRepositoryOptions.database.activity.bulkCreate([
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member1.id,
          sourceId: '#sourceId1',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member2.id,
          sourceId: '#sourceId2',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member2.id,
          sourceId: '#sourceId3',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId4',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId5',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId6',
        },
      ])

      const members = await MemberRepository.findAndCountAll(
        {
          filter: {},
          limit: 15,
          offset: 0,
          orderBy: 'activitiesCount_DESC',
        },
        mockIRepositoryOptions,
      )
      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].activitiesCount).toEqual('3')
      expect(members.rows[1].activitiesCount).toEqual('2')
      expect(members.rows[2].activitiesCount).toEqual('1')
      expect(members.rows[2].tags[0].name).toEqual('nodejs')
      expect(members.rows[1].tags.map((i) => i.name).sort()).toEqual(['nodejs', 'vuejs'])
      expect(members.rows[0].tags[0].name).toEqual('vuejs')
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      const returnedMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const updateFields = {
        username: {
          crowdUsername: 'anil',
          github: 'anil_github',
        },
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
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        bio: 'Computer Science',
        organisation: 'Crowd',
        joinedAt: '2021-06-27T15:14:30Z',
        location: 'Istanbul',
        signals: 'testSignal',
      }

      const updatedMember = await MemberRepository.update(
        returnedMember.id,
        updateFields,
        mockIRepositoryOptions,
      )

      // check updatedAt field looks ok or not. Should be greater than createdAt
      expect(updatedMember.updatedAt.getTime()).toBeGreaterThan(updatedMember.createdAt.getTime())

      updatedMember.createdAt = updatedMember.createdAt.toISOString().split('T')[0]
      updatedMember.updatedAt = updatedMember.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: returnedMember.id,
        username: updateFields.username,
        type: updatedMember.type,
        info: {},
        crowdInfo: updateFields.crowdInfo,
        email: updateFields.email,
        score: updateFields.score,
        bio: updateFields.bio,
        organisation: updateFields.organisation,
        location: updateFields.location,
        signals: updateFields.signals,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },

        joinedAt: new Date(updateFields.joinedAt),
        tags: [],
        noMerge: [],
        toMerge: [],
      }

      expect(updatedMember).toStrictEqual(expectedMemberCreated)
    })

    it('Should update successfuly but return without relations when doPupulateRelations=false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      const returnedMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const updateFields = {
        username: {
          crowdUsername: 'anil',
          github: 'anil_github',
        },
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
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        bio: 'Computer Science',
        organisation: 'Crowd',
        joinedAt: '2021-06-27T15:14:30Z',
        location: 'Istanbul',
        signals: 'testSignal',
      }

      const updatedMember = await MemberRepository.update(
        returnedMember.id,
        updateFields,
        mockIRepositoryOptions,
        false,
      )

      // check updatedAt field looks ok or not. Should be greater than createdAt
      expect(updatedMember.updatedAt.getTime()).toBeGreaterThan(updatedMember.createdAt.getTime())

      updatedMember.createdAt = updatedMember.createdAt.toISOString().split('T')[0]
      updatedMember.updatedAt = updatedMember.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: returnedMember.id,
        username: updateFields.username,
        type: updatedMember.type,
        info: {},
        crowdInfo: updateFields.crowdInfo,
        email: updateFields.email,
        score: updateFields.score,
        bio: updateFields.bio,
        organisation: updateFields.organisation,
        location: updateFields.location,
        signals: updateFields.signals,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date(updateFields.joinedAt),
      }

      expect(updatedMember).toStrictEqual(expectedMemberCreated)
    })

    it('Should successfully update member with given tags', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const tag1 = await TagRepository.create({ name: 'tag1' }, mockIRepositoryOptions)
      const tag2 = await TagRepository.create({ name: 'tag2' }, mockIRepositoryOptions)
      const tag3 = await TagRepository.create({ name: 'tag3' }, mockIRepositoryOptions)

      // Create member with tag3
      let member1 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test1' },
          score: '1',
          joinedAt: new Date(),
          tags: [tag3.id],
        },
        mockIRepositoryOptions,
      )

      // When feeding tags attribute to update, update method will overwrite the member's tags with new given tags
      // member1 is expected to have [tag1,tag2] after update
      member1 = await MemberRepository.update(
        member1.id,
        { tags: [tag1.id, tag2.id] },
        mockIRepositoryOptions,
      )

      member1.createdAt = member1.createdAt.toISOString().split('T')[0]
      member1.updatedAt = member1.updatedAt.toISOString().split('T')[0]

      member1.tags = member1.tags.map((i) => i.get({ plain: true }))

      // strip members field from tags created to expect.
      // we won't be returning second level relationships.
      const { members: _tag1Members, ...tag1Plain } = tag1
      const { members: _tag2Members, ...tag2Plain } = tag2

      const expectedMemberCreated = {
        id: member1.id,
        username: member1.username,
        type: member1.type,
        info: {},
        crowdInfo: member1.crowdInfo,
        email: member1.email,
        score: member1.score,
        bio: member1.bio,
        organisation: member1.organisation,
        location: member1.location,
        signals: member1.signals,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },

        joinedAt: new Date(member1.joinedAt),
        tags: [tag1Plain, tag2Plain],
        noMerge: [],
        toMerge: [],
      }

      expect(member1).toStrictEqual(expectedMemberCreated)
    })

    it('Should throw 404 error when trying to update non existent member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MemberRepository.update(
          randomUUID(),
          { organisation: 'test' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw a sequelize foreign key error when trying to update a member with a non existing tag', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      const member1 = await MemberRepository.create(
        {
          username: { crowdUsername: 'test1' },
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await expect(() =>
        MemberRepository.update(
          member1.id,
          { tags: [randomUUID()] },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'test1' },
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      const returnedMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      await MemberRepository.destroy(returnedMember.id, mockIRepositoryOptions, true)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        MemberRepository.findById(returnedMember.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MemberRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('addToMerge method', () => {
    it('Should add a member to other members toMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { crowdUsername: 'anil2' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const memberCreated2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      const memberUpdated1 = await MemberRepository.addToMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )
      const memberUpdated2 = await MemberRepository.addToMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )

      expect(memberUpdated1.toMerge[0]).toBe(memberUpdated2.id)
      expect(memberUpdated2.toMerge[0]).toBe(memberUpdated1.id)
    })

    it('Should return same result for multiple addToMerge calls for the same member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { crowdUsername: 'anil2' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const memberCreated2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      const memberUpdated1 = await MemberRepository.addToMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )
      const memberUpdated2 = await MemberRepository.addToMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )

      // multiple calls to for same (member, mergeMember) should result in no change
      await MemberRepository.addToMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )

      expect(memberUpdated1.toMerge.length).toBe(1)
      expect(memberUpdated1.toMerge[0]).toBe(memberUpdated2.id)
      expect(memberUpdated2.toMerge[0]).toBe(memberUpdated1.id)
    })
  })

  describe('removeToMerge method', () => {
    it('Should remove a member from other members toMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { crowdUsername: 'anil2' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const memberCreated2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      let memberUpdated1 = await MemberRepository.addToMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )
      const memberUpdated2 = await MemberRepository.addToMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )

      memberUpdated1 = await MemberRepository.removeToMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )

      // Member2 should be removed from Member1.toMerge
      expect(memberUpdated1.toMerge.length).toBe(0)

      // Member1 is still in member2.toMerge list
      expect(memberUpdated2.toMerge[0]).toBe(memberUpdated1.id)
    })
  })

  describe('addNoMerge method', () => {
    it('Should add a member to other members noMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { crowdUsername: 'anil2' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const memberCreated2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      let memberUpdated1 = await MemberRepository.addNoMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )
      const memberUpdated2 = await MemberRepository.addNoMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )

      memberUpdated1 = await MemberRepository.removeToMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )

      expect(memberUpdated1.noMerge[0]).toBe(memberUpdated2.id)
      expect(memberUpdated2.noMerge[0]).toBe(memberUpdated1.id)
    })
  })

  describe('removeNoMerge method', () => {
    it('Should remove a member from other members noMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { crowdUsername: 'anil' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { crowdUsername: 'anil2' },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const memberCreated2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      let memberUpdated1 = await MemberRepository.addNoMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )
      const memberUpdated2 = await MemberRepository.addNoMerge(
        memberCreated2.id,
        memberCreated1.id,
        mockIRepositoryOptions,
      )

      memberUpdated1 = await MemberRepository.removeNoMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )

      // Member2 should be removed from Member1.noMerge
      expect(memberUpdated1.noMerge.length).toBe(0)

      // Member1 is still in member2.noMerge list
      expect(memberUpdated2.noMerge[0]).toBe(memberUpdated1.id)
    })
  })
})
