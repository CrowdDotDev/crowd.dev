import MemberRepository from '../memberRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import TagRepository from '../tagRepository'
import { PlatformType } from '../../../types/integrationEnums'
import OrganizationRepository from '../organizationRepository'
import TaskRepository from '../taskRepository'
import NoteRepository from '../noteRepository'

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
          [PlatformType.GITHUB]: 'anil_github',
        },
        displayName: 'Member 1',
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
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
          [PlatformType.TWITTER]: {
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: member2add.username,
        attributes: member2add.attributes,
        displayName: member2add.displayName,
        email: member2add.email,
        score: member2add.score,
        identities: ['github'],
        organizations: [],
        notes: [],
        tasks: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        activeOn: [],
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        lastActive: null,
        averageSentiment: 0,
        lastActivity: null,
      }
      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should create succesfully but return without relations when doPopulateRelations=false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        displayName: 'Member 1',
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
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
          [PlatformType.TWITTER]: {
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions, false)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: member2add.username,
        displayName: member2add.displayName,
        attributes: member2add.attributes,
        email: member2add.email,
        score: member2add.score,
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
        username: { [PlatformType.GITHUB]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: member2add.username,
        displayName: member2add.displayName,
        organizations: [],
        attributes: {},
        identities: ['github'],
        email: null,
        score: -1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        activeOn: [],
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        notes: [],
        tasks: [],
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        averageSentiment: 0,
        lastActive: null,
        lastActivity: null,
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
        username: { [PlatformType.GITHUB]: 'anil' },
        email: 'test@crowd.dev',
      }

      await expect(() =>
        MemberRepository.create(member2add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should succesfully create member with notes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const notes1 = await NoteRepository.create(
        {
          body: 'note1',
        },
        mockIRepositoryOptions,
      )

      const notes2 = await NoteRepository.create(
        {
          body: 'note2',
        },
        mockIRepositoryOptions,
      )

      const member2add = {
        username: { [PlatformType.SLACK]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        notes: [notes1.id, notes2.id],
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      expect(memberCreated.notes).toHaveLength(2)
      expect(memberCreated.notes[0].id).toEqual(notes1.id)
      expect(memberCreated.notes[1].id).toEqual(notes2.id)
    })

    it('Should succesfully create member with tasks', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const tasks1 = await TaskRepository.create(
        {
          name: 'task1',
        },
        mockIRepositoryOptions,
      )

      const task2 = await TaskRepository.create(
        {
          name: 'task2',
        },
        mockIRepositoryOptions,
      )

      const member2add = {
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        tasks: [tasks1.id, task2.id],
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      expect(memberCreated.tasks).toHaveLength(2)
      expect(memberCreated.tasks[0].id).toEqual(tasks1.id)
      expect(memberCreated.tasks[1].id).toEqual(task2.id)
    })
  })

  describe('findById method', () => {
    it('Should successfully find created member by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: { [PlatformType.GITHUB]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)

      const expectedMemberFound = {
        id: memberCreated.id,
        username: member2add.username,
        displayName: member2add.displayName,
        identities: ['github'],
        attributes: {},
        email: null,
        score: -1,
        importHash: null,
        organizations: [],
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        activeOn: [],
        reach: { total: -1 },
        notes: [],
        tasks: [],
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        averageSentiment: 0,
        lastActive: null,
        lastActivity: null,
      }

      const memberById = await MemberRepository.findById(memberCreated.id, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberById.createdAt = memberById.createdAt.toISOString().split('T')[0]
      memberById.updatedAt = memberById.updatedAt.toISOString().split('T')[0]

      expect(memberById).toStrictEqual(expectedMemberFound)
    })

    it('Should return a plain object when called with doPopulateRelations false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: { [PlatformType.GITHUB]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)

      const expectedMemberFound = {
        id: memberCreated.id,
        username: member2add.username,
        displayName: member2add.displayName,
        attributes: {},
        email: null,
        score: -1,
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
        username: { [PlatformType.GITHUB]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }
      const member2 = {
        username: { [PlatformType.GITHUB]: 'test2' },
        displayName: 'some-other-name',
        joinedAt: '2020-05-28T15:13:30Z',
      }

      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)
      const member2Returned = await MemberRepository.create(member2, mockIRepositoryOptions)

      const filterIdsReturned = await MemberRepository.filterIdsInTenant(
        [member1Returned.id, member2Returned.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([member1Returned.id, member2Returned.id])
    })

    it('Should only return the ids of previously created members and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.GITHUB]: 'test3' },
        displayName: 'Member 1',
        joinedAt: '2020-05-29T15:14:30Z',
      }

      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)

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
        username: { [PlatformType.GITHUB]: 'test3' },
        displayName: 'Member 1',
        joinedAt: '2020-04-29T15:14:30Z',
      }

      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)

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
        username: { [PlatformType.GITHUB]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)

      const found = await MemberRepository.findOne(
        { email: 'joan@crowd.dev' },
        mockIRepositoryOptions,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should return a plain object when doPopulateRelations is false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { [PlatformType.GITHUB]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)
      delete member1Returned.toMerge
      delete member1Returned.noMerge
      delete member1Returned.tags
      delete member1Returned.activities
      delete member1Returned.organizations
      delete member1Returned.tasks
      delete member1Returned.notes
      delete member1Returned.lastActive
      delete member1Returned.averageSentiment
      delete member1Returned.activityCount
      delete member1Returned.lastActivity
      delete member1Returned.activeOn
      delete member1Returned.identities

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
        username: { [PlatformType.DEVTO]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)

      const memberFilterString = `username.${PlatformType.DEVTO}`

      const found = await MemberRepository.findOne(
        { [memberFilterString]: 'test1' },
        mockIRepositoryOptions,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should throw an error when non-existent', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.DEVTO]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      const usernameFilter = `username.${PlatformType.DEVTO}`

      await expect(() =>
        MemberRepository.findOne({ [usernameFilter]: 'test2' }, mockIRepositoryOptions),
      )
    })
  })

  describe('memberExists method', () => {
    it('Should return the created member for a simple query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { [PlatformType.TWITTER]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)

      const found = await MemberRepository.memberExists(
        'test1',
        PlatformType.TWITTER,
        mockIRepositoryOptions,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should a plain object when called with doPopulateRelations false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: { [PlatformType.TWITTER]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)
      delete member1Returned.toMerge
      delete member1Returned.noMerge
      delete member1Returned.tags
      delete member1Returned.activities
      delete member1Returned.organizations
      delete member1Returned.notes
      delete member1Returned.tasks
      delete member1Returned.lastActive
      delete member1Returned.activityCount
      delete member1Returned.averageSentiment
      delete member1Returned.lastActivity
      delete member1Returned.activeOn
      delete member1Returned.identities

      const found = await MemberRepository.memberExists(
        'test1',
        PlatformType.TWITTER,
        mockIRepositoryOptions,
        false,
      )

      expect(found).toStrictEqual(member1Returned)
    })

    it('Should return null when non-existent at platform level', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.TWITTER]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        MemberRepository.memberExists('test1', PlatformType.GITHUB, mockIRepositoryOptions),
      )
    })

    it('Should return null when non-existent at username level', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.TWITTER]: 'test1' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        email: 'joan@crowd.dev',
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      const memberExists = await MemberRepository.memberExists(
        'test2',
        PlatformType.TWITTER,
        mockIRepositoryOptions,
      )

      expect(memberExists).toBeNull()
    })
  })

  describe('findAndCountAll method', () => {
    it('is successfully finding and counting all members, sortedBy activitiesCount DESC', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      const member2 = await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      const member3 = await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test3' },
          displayName: 'Member 3',
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

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: {}, orderBy: 'activityCount_DESC' },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].activityCount).toEqual('3')
      expect(members.rows[1].activityCount).toEqual('2')
      expect(members.rows[2].activityCount).toEqual('1')
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
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.GITHUB]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: { tags: [nodeTag.id, vueTag.id] } },
        mockIRepositoryOptions,
      )
      const member2 = members.rows.find((m) => m.username[PlatformType.TWITTER] === 'test2')
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
          username: { [PlatformType.GITHUB]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
          tags: [nodeTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.GITHUB]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.GITHUB]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: { tags: [nodeTag.id] } },
        mockIRepositoryOptions,
      )
      const member1 = members.rows.find((m) => m.username[PlatformType.GITHUB] === 'test1')
      const member2 = members.rows.find((m) => m.username[PlatformType.GITHUB] === 'test2')

      expect(members.rows.length).toEqual(2)
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member2.tags[1].name).toEqual('vuejs')
    })

    it('is successfully finding and counting all members, and organisations [crowd.dev, pied piper]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const crowd = await mockIRepositoryOptions.database.organization.create({
        name: 'crowd.dev',
        url: 'https://crowd.dev',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })
      const pp = await mockIRepositoryOptions.database.organization.create({
        name: 'pied piper',
        url: 'https://piedpiper.com',
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })

      await MemberRepository.create(
        {
          username: { [PlatformType.SLACK]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.SLACK]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          organizations: [crowd.id, pp.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.SLACK]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: { organizations: [crowd.id, pp.id] } },
        mockIRepositoryOptions,
      )
      const member2 = members.rows.find((m) => m.username[PlatformType.SLACK] === 'test2')
      expect(members.rows.length).toEqual(1)
      expect(member2.organizations[0].name).toEqual('crowd.dev')
      expect(member2.organizations[1].name).toEqual('pied piper')
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 1 and less or equal to 6', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: { [PlatformType.SLACK]: 'test1' },
        displayName: 'Member 1',
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: { [PlatformType.SLACK]: 'test2' },
        displayName: 'Member 2',
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: { [PlatformType.SLACK]: 'test3' },
        displayName: 'Member 1',
        score: '7',
        joinedAt: new Date(),
      }
      await MemberRepository.create(user1, mockIRepositoryOptions)
      await MemberRepository.create(user2, mockIRepositoryOptions)
      await MemberRepository.create(user3, mockIRepositoryOptions)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: { scoreRange: [1, 6] } },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows.find((m) => m.username[PlatformType.SLACK] === 'test1').score).toEqual(1)
      expect(members.rows.find((m) => m.username[PlatformType.SLACK] === 'test2').score).toEqual(6)
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 7', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: { [PlatformType.DISCORD]: 'test1' },
        displayName: 'Member 1',
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: { [PlatformType.DISCORD]: 'test2' },
        displayName: 'Member 2',
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: { [PlatformType.DISCORD]: 'test3' },
        displayName: 'Member 3',
        score: '7',
        joinedAt: new Date(),
      }
      await MemberRepository.create(user1, mockIRepositoryOptions)
      await MemberRepository.create(user2, mockIRepositoryOptions)
      await MemberRepository.create(user3, mockIRepositoryOptions)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: { scoreRange: [7] } },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(1)
      for (const member of members.rows) {
        expect(member.score).toBeGreaterThanOrEqual(7)
      }
    })

    it('is successfully find and counting members with various filters, computed attributes, and full options (filter, limit, offset and orderBy)', async () => {
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
          username: { [PlatformType.DISCORD]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
          tags: [nodeTag.id],
          reach: {
            total: 15,
          },
        },
        mockIRepositoryOptions,
      )
      const member2 = await MemberRepository.create(
        {
          username: { [PlatformType.DISCORD]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
          reach: {
            total: 55,
          },
        },
        mockIRepositoryOptions,
      )
      const member3 = await MemberRepository.create(
        {
          username: { [PlatformType.DISCORD]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
          tags: [vueTag.id],
          reach: {
            total: 124,
          },
        },
        mockIRepositoryOptions,
      )

      await mockIRepositoryOptions.database.activity.bulkCreate([
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date('2022-09-10'),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member1.id,
          sourceId: '#sourceId1',
          sentiment: {
            positive: 0.55,
            negative: 0.0,
            neutral: 0.45,
            mixed: 0.0,
            label: 'positive',
            sentiment: 0.1,
          },
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date('2022-09-11'),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member2.id,
          sourceId: '#sourceId2',
          sentiment: {
            positive: 0.01,
            negative: 0.55,
            neutral: 0.55,
            mixed: 0.0,
            label: 'negative',
            sentiment: -0.54,
          },
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date('2022-09-12'),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member2.id,
          sourceId: '#sourceId3',
          sentiment: {
            positive: 0.94,
            negative: 0.0,
            neutral: 0.06,
            mixed: 0.0,
            label: 'positive',
            sentiment: 0.94,
          },
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date('2022-09-13'),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId4',
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            mixed: 0.42,
            label: 'positive',
            sentiment: 0.42,
          },
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date('2022-09-14'),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId5',
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            mixed: 0.42,
            label: 'positive',
            sentiment: 0.41,
          },
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date('2022-09-15'),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          memberId: member3.id,
          sourceId: '#sourceId6',
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            mixed: 0.42,
            label: 'positive',
            sentiment: 0.18,
          },
        },
      ])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      let members = await MemberRepository.findAndCountAll(
        {
          filter: {},
          limit: 15,
          offset: 0,
          orderBy: 'activityCount_DESC',
        },
        mockIRepositoryOptions,
      )
      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].activityCount).toEqual('3')
      expect(members.rows[0].lastActive.toISOString()).toEqual('2022-09-15T00:00:00.000Z')

      expect(members.rows[1].activityCount).toEqual('2')
      expect(members.rows[1].lastActive.toISOString()).toEqual('2022-09-12T00:00:00.000Z')

      expect(members.rows[2].activityCount).toEqual('1')
      expect(members.rows[2].tags[0].name).toEqual('nodejs')
      expect(members.rows[2].lastActive.toISOString()).toEqual('2022-09-10T00:00:00.000Z')

      expect(members.rows[1].tags.map((i) => i.name).sort()).toEqual(['nodejs', 'vuejs'])
      expect(members.rows[0].tags[0].name).toEqual('vuejs')

      // filter and order by reach
      members = await MemberRepository.findAndCountAll(
        {
          filter: {
            reachRange: [55],
          },
          limit: 15,
          offset: 0,
          orderBy: 'reach_DESC',
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows[0].id).toEqual(member3.id)
      expect(members.rows[1].id).toEqual(member2.id)

      // filter and sort by activity count
      members = await MemberRepository.findAndCountAll(
        {
          filter: {
            activityCountRange: [2],
          },
          limit: 15,
          offset: 0,
          orderBy: 'activityCount_DESC',
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows.map((i) => i.id)).toEqual([member3.id, member2.id])

      // filter and sort by lastActive
      members = await MemberRepository.findAndCountAll(
        {
          filter: {
            lastActiveRange: ['2022-09-11'],
          },
          limit: 15,
          offset: 0,
          orderBy: 'lastActive_DESC',
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows.map((i) => i.id)).toEqual([member3.id, member2.id])

      // filter and sort by averageSentiment (member1.avgSentiment = 0.1, member2.avgSentiment = 0.2, member3.avgSentiment = 0.34)
      members = await MemberRepository.findAndCountAll(
        {
          filter: {
            averageSentimentRange: [0.2],
          },
          limit: 15,
          offset: 0,
          orderBy: 'averageSentiment_ASC',
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows.map((i) => i.id)).toEqual([member2.id, member3.id])
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.DISCORD]: 'test1' },
        displayName: 'Member 1',
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      const returnedMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const updateFields = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
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
          [PlatformType.TWITTER]: {
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        joinedAt: '2021-06-27T15:14:30Z',
        location: 'Istanbul',
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
        identities: ['github'],
        displayName: returnedMember.displayName,
        attributes: updateFields.attributes,
        email: updateFields.email,
        score: updateFields.score,
        organizations: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },
        notes: [],
        tasks: [],
        activeOn: [],
        joinedAt: new Date(updateFields.joinedAt),
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        averageSentiment: 0,
        lastActive: null,
        lastActivity: null,
      }

      expect(updatedMember).toStrictEqual(expectedMemberCreated)
    })

    it('Should update successfuly but return without relations when doPopulateRelations=false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.DISCORD]: 'test1' },
        displayName: 'Member 1',
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      const returnedMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const updateFields = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [PlatformType.GITHUB]: {
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
          [PlatformType.TWITTER]: {
            profile_url: 'https://twitter.com/imcvampire',
            url: 'https://twitter.com/imcvampire',
          },
        },
        joinedAt: '2021-06-27T15:14:30Z',
        location: 'Istanbul',
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
        displayName: returnedMember.displayName,
        attributes: updateFields.attributes,
        email: updateFields.email,
        score: updateFields.score,
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
          username: { [PlatformType.DISCORD]: 'test1' },
          displayName: 'Member 1',
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
        displayName: member1.displayName,
        identities: ['discord'],
        attributes: {},
        email: member1.email,
        score: member1.score,
        organizations: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activities: [],
        reach: { total: -1 },
        notes: [],
        tasks: [],
        activeOn: [],
        joinedAt: new Date(member1.joinedAt),
        tags: [tag1Plain, tag2Plain],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        averageSentiment: 0,
        lastActive: null,
        lastActivity: null,
      }

      expect(member1).toStrictEqual(expectedMemberCreated)
    })

    it('Should successfully update member with given organizations', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const org1 = await OrganizationRepository.create(
        { name: 'crowd.dev', url: 'https://crowd.dev' },
        mockIRepositoryOptions,
      )
      const org2 = await OrganizationRepository.create(
        { name: 'pied piper', url: 'https://piedpiper.com' },
        mockIRepositoryOptions,
      )
      const org3 = await OrganizationRepository.create(
        { name: 'hooli', url: 'https://hooli.com' },
        mockIRepositoryOptions,
      )

      // Create member with tag3
      let member1 = await MemberRepository.create(
        {
          username: { [PlatformType.DISCORD]: 'test1' },
          displayName: 'Member 1',
          joinedAt: new Date(),
          organizations: [org3.id],
        },
        mockIRepositoryOptions,
      )

      // When feeding organizations attribute to update, update method will overwrite the member's organizations with new given orgs
      // member1 is expected to have [org1,org2] after update
      member1 = await MemberRepository.update(
        member1.id,
        { organizations: [org1.id, org2.id] },
        mockIRepositoryOptions,
      )

      member1.createdAt = member1.createdAt.toISOString().split('T')[0]
      member1.updatedAt = member1.updatedAt.toISOString().split('T')[0]

      member1.organizations = member1.organizations.map((i) => i.get({ plain: true }))

      // strip members field from tags created to expect.
      // we won't be returning second level relationships.
      const { memberCount: _tag1Members, ...org1Plain } = org1
      const { memberCount: _tag2Members, ...org2Plain } = org2

      const expectedMemberCreated = {
        id: member1.id,
        username: member1.username,
        displayName: member1.displayName,
        identities: ['discord'],
        attributes: {},
        email: member1.email,
        score: member1.score,
        tags: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activeOn: [],
        activities: [],
        reach: { total: -1 },
        joinedAt: new Date(member1.joinedAt),
        organizations: [
          SequelizeTestUtils.objectWithoutKey(org1Plain, [
            'lastActive',
            'identities',
            'activeOn',
            'joinedAt',
            'activityCount'
          ]),
          SequelizeTestUtils.objectWithoutKey(org2Plain, [
            'lastActive',
            'identities',
            'activeOn',
            'joinedAt',
            'activityCount'
          ]),
        ],
        noMerge: [],
        toMerge: [],
        notes: [],
        tasks: [],
        activityCount: 0,
        averageSentiment: 0,
        lastActive: null,
        lastActivity: null,
      }

      expect(member1).toStrictEqual(expectedMemberCreated)
    })

    it('Should succesfully update member with notes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const notes1 = await NoteRepository.create(
        {
          body: 'note1',
        },
        mockIRepositoryOptions,
      )

      const notes2 = await NoteRepository.create(
        {
          body: 'note2',
        },
        mockIRepositoryOptions,
      )

      const member2add = {
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      const memberUpdated = await MemberRepository.update(
        memberCreated.id,
        { notes: [notes1.id, notes2.id] },
        mockIRepositoryOptions,
      )
      expect(memberCreated.notes).toHaveLength(0)
      expect(memberUpdated.notes).toHaveLength(2)
      expect(memberUpdated.notes[0].id).toEqual(notes1.id)
      expect(memberUpdated.notes[1].id).toEqual(notes2.id)
    })

    it('Should succesfully create member with tasks', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const tasks1 = await TaskRepository.create(
        {
          name: 'task1',
        },
        mockIRepositoryOptions,
      )

      const task2 = await TaskRepository.create(
        {
          name: 'task2',
        },
        mockIRepositoryOptions,
      )

      const member2add = {
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      expect(memberCreated.tasks).toHaveLength(0)

      const memberUpdated = await MemberRepository.update(
        memberCreated.id,
        { tasks: [tasks1.id, task2.id] },
        mockIRepositoryOptions,
      )
      expect(memberUpdated.tasks).toHaveLength(2)
      expect(memberUpdated.tasks[0].id).toEqual(tasks1.id)
      expect(memberUpdated.tasks[1].id).toEqual(task2.id)
    })

    it('Should throw 404 error when trying to update non existent member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MemberRepository.update(randomUUID(), { location: 'test' }, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw a sequelize foreign key error when trying to update a member with a non existing tag', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      const member1 = await MemberRepository.create(
        {
          username: { [PlatformType.DISCORD]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await expect(() =>
        MemberRepository.update(member1.id, { tags: [randomUUID()] }, mockIRepositoryOptions),
      ).rejects.toThrow()
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: { [PlatformType.DISCORD]: 'test1' },
        displayName: 'Member 1',
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
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { [PlatformType.DISCORD]: 'anil2' },
        displayName: 'Member 2',
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
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { [PlatformType.DISCORD]: 'anil2' },
        displayName: 'Member 2',
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
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { [PlatformType.DISCORD]: 'anil2' },
        displayName: 'Member 2',
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
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { [PlatformType.DISCORD]: 'anil2' },
        displayName: 'Member 2',
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
        username: { [PlatformType.DISCORD]: 'anil' },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: { [PlatformType.DISCORD]: 'anil2' },
        displayName: 'Member 2',
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
