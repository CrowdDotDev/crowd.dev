import { v4 as uuid } from 'uuid'
import moment from 'moment'

import { Error404 } from '@crowd/common'
import { PlatformType, SegmentStatus } from '@crowd/types'
import { generateUUIDv1 } from '@crowd/common'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import MemberRepository from '../memberRepository'
import NoteRepository from '../noteRepository'
import OrganizationRepository from '../organizationRepository'
import TagRepository from '../tagRepository'
import TaskRepository from '../taskRepository'
import lodash from 'lodash'
import SegmentRepository from '../segmentRepository'
import { populateSegments } from '../../utils/segmentTestUtils'
import MemberService from '../../../services/memberService'
import OrganizationService from '../../../services/organizationService'

const db = null

function mapUsername(data: any): any {
  const username = {}
  Object.keys(data).forEach((platform) => {
    const usernameData = data[platform]

    if (Array.isArray(usernameData)) {
      username[platform] = []
      if (usernameData.length > 0) {
        for (const entry of usernameData) {
          if (typeof entry === 'string') {
            username[platform].push(entry)
          } else if (typeof entry === 'object') {
            username[platform].push((entry as any).username)
          } else {
            throw new Error('Invalid username type')
          }
        }
      }
    } else if (typeof usernameData === 'object') {
      username[platform] = [usernameData.username]
    } else if (typeof usernameData === 'string') {
      username[platform] = [usernameData]
    } else {
      throw new Error('Invalid username type')
    }
  })
  return username
}

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
          [PlatformType.GITHUB]: {
            username: 'anil_github',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        emails: ['lala@l.com'],
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

      const cloned = lodash.cloneDeep(member2add)
      const memberCreated = await MemberRepository.create(cloned, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: mapUsername(member2add.username),
        attributes: member2add.attributes,
        displayName: member2add.displayName,
        emails: member2add.emails,
        score: member2add.score,
        identities: ['github'],
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        organizations: [],
        notes: [],
        tasks: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activeOn: [],
        activityTypes: [],
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        activeDaysCount: 0,
        lastActive: null,
        averageSentiment: 0,
        numberOfOpenSourceContributions: 0,
        lastActivity: null,
        affiliations: [],
        manuallyCreated: false,
      }
      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should create succesfully but return without relations when doPopulateRelations=false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil_github',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        emails: ['lala@l.com'],
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

      const cloned = lodash.cloneDeep(member2add)
      const memberCreated = await MemberRepository.create(cloned, mockIRepositoryOptions, false)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: mapUsername(member2add.username),
        displayName: member2add.displayName,
        attributes: member2add.attributes,
        emails: member2add.emails,
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        score: member2add.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        organizations: [],
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        affiliations: [],
        manuallyCreated: false,
      }
      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should succesfully create member with only mandatory username and joinedAt fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const cloned = lodash.cloneDeep(member2add)
      const memberCreated = await MemberRepository.create(cloned, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      memberCreated.createdAt = memberCreated.createdAt.toISOString().split('T')[0]
      memberCreated.updatedAt = memberCreated.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: memberCreated.id,
        username: mapUsername(member2add.username),
        displayName: member2add.displayName,
        organizations: [],
        attributes: {},
        identities: ['github'],
        emails: [],
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        score: -1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activeOn: [],
        activityTypes: [],
        reach: { total: -1 },
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        notes: [],
        tasks: [],
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        activeDaysCount: 0,
        averageSentiment: 0,
        numberOfOpenSourceContributions: 0,
        lastActive: null,
        lastActivity: null,
        affiliations: [],
        manuallyCreated: false,
      }

      expect(memberCreated).toStrictEqual(expectedMemberCreated)
    })

    it('Should throw error when no username given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // no username field, should reject the promise with
      // sequelize unique constraint
      const member2add = {
        joinedAt: '2020-05-27T15:13:30Z',
        emails: ['test@crowd.dev'],
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
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        emails: ['test@crowd.dev'],
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
        username: {
          [PlatformType.SLACK]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
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
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        tasks: [tasks1.id, task2.id],
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      expect(memberCreated.tasks).toHaveLength(2)
      expect(memberCreated.tasks.find((t) => t.id === tasks1.id)).not.toBeUndefined()
      expect(memberCreated.tasks.find((t) => t.id === task2.id)).not.toBeUndefined()
    })

    it('Should succesfully create member with organization affiliations', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const segmentRepo = new SegmentRepository(mockIRepositoryOptions)

      const segment1 = await segmentRepo.create({
        name: 'Crowd.dev - Segment1',
        url: '',
        parentName: 'Crowd.dev - Segment1',
        grandparentName: 'Crowd.dev - Segment1',
        slug: 'crowd.dev-1',
        parentSlug: 'crowd.dev-1',
        grandparentSlug: 'crowd.dev-1',
        status: SegmentStatus.ACTIVE,
        sourceId: null,
        sourceParentId: null,
      })

      const segment2 = await segmentRepo.create({
        name: 'Crowd.dev - Segment2',
        url: '',
        parentName: 'Crowd.dev - Segment2',
        grandparentName: 'Crowd.dev - Segment2',
        slug: 'crowd.dev-2',
        parentSlug: 'crowd.dev-2',
        grandparentSlug: 'crowd.dev-2',
        status: SegmentStatus.ACTIVE,
        sourceId: null,
        sourceParentId: null,
      })

      const org1 = await OrganizationRepository.create(
        {
          displayName: 'crowd.dev',
        },
        mockIRepositoryOptions,
      )

      const member2add = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        affiliations: [
          {
            segmentId: segment1.id,
            organizationId: org1.id,
          },
          {
            segmentId: segment2.id,
            organizationId: null,
          },
        ],
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      expect(memberCreated.affiliations).toHaveLength(2)
      expect(
        memberCreated.affiliations.filter((a) => a.segmentId === segment1.id)[0].organizationId,
      ).toEqual(org1.id)
      expect(
        memberCreated.affiliations.filter((a) => a.segmentId === segment2.id)[0].organizationId,
      ).toBeNull()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created member by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member2add = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const cloned = lodash.cloneDeep(member2add)
      const memberCreated = await MemberRepository.create(cloned, mockIRepositoryOptions)

      const expectedMemberFound = {
        id: memberCreated.id,
        username: mapUsername(member2add.username),
        displayName: member2add.displayName,
        identities: ['github'],
        attributes: {},
        emails: [],
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        score: -1,
        importHash: null,
        organizations: [],
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activeOn: [],
        activityTypes: [],
        reach: { total: -1 },
        notes: [],
        tasks: [],
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        activeDaysCount: 0,
        averageSentiment: 0,
        numberOfOpenSourceContributions: 0,
        lastActive: null,
        lastActivity: null,
        affiliations: [],
        manuallyCreated: false,
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
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const cloned = lodash.cloneDeep(member2add)
      const memberCreated = await MemberRepository.create(cloned, mockIRepositoryOptions)

      const expectedMemberFound = {
        id: memberCreated.id,
        username: mapUsername(member2add.username),
        displayName: member2add.displayName,
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        attributes: {},
        emails: [],
        score: -1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        organizations: [],
        joinedAt: new Date('2020-05-27T15:13:30Z'),
        affiliations: [],
        manuallyCreated: false,
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
        username: {
          [PlatformType.GITHUB]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }
      const member2 = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'test2',
            integrationId: generateUUIDv1(),
          },
        },
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
        username: {
          [PlatformType.GITHUB]: {
            username: 'test3',
            integrationId: generateUUIDv1(),
          },
        },
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
        username: {
          [PlatformType.GITHUB]: {
            username: 'test3',
            integrationId: generateUUIDv1(),
          },
        },
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

  describe('memberExists method', () => {
    it('Should return the created member for a simple query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const member1 = {
        username: {
          [PlatformType.TWITTER]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        emails: ['joan@crowd.dev'],
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
        username: {
          [PlatformType.TWITTER]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        emails: ['joan@crowd.dev'],
      }
      const member1Returned = await MemberRepository.create(member1, mockIRepositoryOptions)
      delete member1Returned.toMerge
      delete member1Returned.noMerge
      delete member1Returned.tags
      delete member1Returned.activities
      delete member1Returned.notes
      delete member1Returned.tasks
      delete member1Returned.lastActive
      delete member1Returned.activityCount
      delete member1Returned.averageSentiment
      delete member1Returned.lastActivity
      delete member1Returned.activeOn
      delete member1Returned.identities
      delete member1Returned.activityTypes
      delete member1Returned.activeDaysCount
      delete member1Returned.numberOfOpenSourceContributions
      delete member1Returned.affiliations
      delete member1Returned.manuallyCreated
      member1Returned.segments = member1Returned.segments.map((s) => s.id)

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
        username: {
          [PlatformType.TWITTER]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        emails: ['joan@crowd.dev'],
      }
      await MemberRepository.create(member1, mockIRepositoryOptions)

      await expect(() =>
        MemberRepository.memberExists('test1', PlatformType.GITHUB, mockIRepositoryOptions),
      )
    })

    it('Should return null when non-existent at username level', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: {
          [PlatformType.TWITTER]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        emails: ['joan@crowd.dev'],
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
          username: {
            [PlatformType.SLACK]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      const member2 = await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      const member3 = await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member1.id,
          username: member1.username[PlatformType.SLACK],
          sourceId: '#sourceId1',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member2.id,
          username: member2.username[PlatformType.SLACK],
          sourceId: '#sourceId2',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member2.id,
          username: member2.username[PlatformType.SLACK],
          sourceId: '#sourceId3',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
          sourceId: '#sourceId4',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
          sourceId: '#sourceId5',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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

    it('is successfully finding and counting all members, sortedBy numberOfOpenSourceContributions DESC', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: {}, orderBy: 'numberOfOpenSourceContributions_DESC' },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].numberOfOpenSourceContributions).toEqual(3)
      expect(members.rows[1].numberOfOpenSourceContributions).toEqual(2)
      expect(members.rows[2].numberOfOpenSourceContributions).toEqual(0)
    })

    it('is successfully finding and counting all members, numberOfOpenSourceContributions range gte than 3 and less or equal to 6', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
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
            {
              id: 112529473,
              url: 'https://github.com/bighead/silicon-valley',
              topics: ['TV Shows', 'Comedy', 'Startups'],
              summary: 'Silicon Valley: 50 commits in 2 weeks',
              numberCommits: 50,
              lastCommitDate: '02/01/2023',
              firstCommitDate: '01/17/2023',
            },
          ],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        { filter: { numberOfOpenSourceContributionsRange: [3, 6] } },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(1)
      expect(members.rows[0].numberOfOpenSourceContributions).toEqual(4)
    })

    it('is successfully finding and counting all members, numberOfOpenSourceContributions range gte 2', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
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
            {
              id: 112529473,
              url: 'https://github.com/bighead/silicon-valley',
              topics: ['TV Shows', 'Comedy', 'Startups'],
              summary: 'Silicon Valley: 50 commits in 2 weeks',
              numberCommits: 50,
              lastCommitDate: '02/01/2023',
              firstCommitDate: '01/17/2023',
            },
          ],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAll(
        {
          filter: { numberOfOpenSourceContributionsRange: [2] },
          orderBy: 'numberOfOpenSourceContributions_DESC',
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows[0].numberOfOpenSourceContributions).toEqual(4)
      expect(members.rows[1].numberOfOpenSourceContributions).toEqual(2)
    })

    it('is successfully finding and counting all members, and tags [nodejs, vuejs]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
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
      const member2 = members.rows.find((m) => m.username[PlatformType.TWITTER][0] === 'test2')
      expect(members.rows.length).toEqual(1)
      expect(member2.tags[0].name).toEqual('nodejs')
      expect(member2.tags[1].name).toEqual('vuejs')
    })

    it('is successfully finding and counting all members, and tags [nodejs]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
          tags: [nodeTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
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
      const member1 = members.rows.find((m) => m.username[PlatformType.GITHUB][0] === 'test1')
      const member2 = members.rows.find((m) => m.username[PlatformType.GITHUB][0] === 'test2')

      expect(members.rows.length).toEqual(2)
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member2.tags[1].name).toEqual('vuejs')
    })

    it('is successfully finding and counting all members, and organisations [crowd.dev, pied piper]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const crowd = await mockIRepositoryOptions.database.organization.create({
        displayName: 'crowd.dev',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      await OrganizationRepository.addIdentity(
        crowd.id,
        {
          name: 'crowd.dev',
          url: 'https://crowd.dev',
          platform: 'crowd',
        },
        mockIRepositoryOptions,
      )

      const pp = await mockIRepositoryOptions.database.organization.create({
        displayName: 'pied piper',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      await OrganizationRepository.addIdentity(
        pp.id,
        {
          name: 'pied piper',
          url: 'https://piedpiper.com',
          platform: 'crowd',
        },
        mockIRepositoryOptions,
      )

      await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          organizations: [crowd.id, pp.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
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
      const member2 = members.rows.find((m) => m.username[PlatformType.SLACK][0] === 'test2')
      expect(members.rows.length).toEqual(1)
      expect(member2.organizations[0].displayName).toEqual('crowd.dev')
      expect(member2.organizations[1].displayName).toEqual('pied piper')
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 1 and less or equal to 6', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: {
          [PlatformType.SLACK]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: {
          [PlatformType.SLACK]: {
            username: 'test2',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 2',
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: {
          [PlatformType.SLACK]: {
            username: 'test3',
            integrationId: generateUUIDv1(),
          },
        },
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
      expect(members.rows.find((m) => m.username[PlatformType.SLACK][0] === 'test1').score).toEqual(
        1,
      )
      expect(members.rows.find((m) => m.username[PlatformType.SLACK][0] === 'test2').score).toEqual(
        6,
      )
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 7', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test2',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 2',
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test3',
            integrationId: generateUUIDv1(),
          },
        },
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
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      const member1 = await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
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
          username: {
            [PlatformType.SLACK]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
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
          username: {
            [PlatformType.SLACK]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member1.id,
          username: member1.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member2.id,
          username: member2.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member2.id,
          username: member2.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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

  describe('findAndCountAllv2 method', () => {
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          username: 'test1',
          memberId: member1.id,
          sourceId: '#sourceId1',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          username: 'test2',
          memberId: member2.id,
          sourceId: '#sourceId2',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          username: 'test2',
          memberId: member2.id,
          sourceId: '#sourceId3',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          username: 'test3',
          memberId: member3.id,
          sourceId: '#sourceId4',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          username: 'test3',
          memberId: member3.id,
          sourceId: '#sourceId5',
        },
        {
          type: 'message',
          platform: PlatformType.SLACK,
          timestamp: new Date(),
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          username: 'test3',
          memberId: member3.id,
          sourceId: '#sourceId6',
        },
      ])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        { filter: {}, orderBy: 'activityCount_DESC' },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].activityCount).toEqual('3')
      expect(members.rows[1].activityCount).toEqual('2')
      expect(members.rows[2].activityCount).toEqual('1')
    })

    it('is successfully finding and counting all members, sortedBy numberOfOpenSourceContributions DESC', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        { filter: {}, orderBy: 'numberOfOpenSourceContributions_DESC' },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(3)
      expect(members.rows[0].numberOfOpenSourceContributions).toEqual(3)
      expect(members.rows[1].numberOfOpenSourceContributions).toEqual(2)
      expect(members.rows[2].numberOfOpenSourceContributions).toEqual(0)
    })

    it('is successfully finding and counting all members, numberOfOpenSourceContributions range gte 3', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
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
            {
              id: 112529473,
              url: 'https://github.com/bighead/silicon-valley',
              topics: ['TV Shows', 'Comedy', 'Startups'],
              summary: 'Silicon Valley: 50 commits in 2 weeks',
              numberCommits: 50,
              lastCommitDate: '02/01/2023',
              firstCommitDate: '01/17/2023',
            },
          ],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    numberOfOpenSourceContributions: {
                      gte: 3,
                    },
                  },
                ],
              },
            ],
          },
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(1)
      expect(members.rows[0].numberOfOpenSourceContributions).toEqual(4)
    })

    it('is successfully finding and counting all members, numberOfOpenSourceContributions range gte 2 and sort by asc', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test1' },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
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
            {
              id: 112529473,
              url: 'https://github.com/bighead/silicon-valley',
              topics: ['TV Shows', 'Comedy', 'Startups'],
              summary: 'Silicon Valley: 50 commits in 2 weeks',
              numberCommits: 50,
              lastCommitDate: '02/01/2023',
              firstCommitDate: '01/17/2023',
            },
          ],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test2' },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
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
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: { [PlatformType.TWITTER]: 'test3' },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)
      const members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    numberOfOpenSourceContributions: {
                      gte: 2,
                    },
                  },
                ],
              },
            ],
          },
          orderBy: 'numberOfOpenSourceContributions_ASC',
        },
        mockIRepositoryOptions,
      )

      expect(members.rows.length).toEqual(2)
      expect(members.rows[0].numberOfOpenSourceContributions).toEqual(2)
      expect(members.rows[1].numberOfOpenSourceContributions).toEqual(4)
    })

    it('is successfully finding and counting all members, and tags [nodejs, vuejs]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.TWITTER]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                tags: {
                  contains: [nodeTag.id, vueTag.id],
                },
              },
            ],
          },
        },
        mockIRepositoryOptions,
      )
      const member2 = members.rows.find((m) => m.username[PlatformType.TWITTER].includes('test2'))
      expect(members.rows.length).toEqual(1)
      expect(member2.tags.map((t) => t.name)).toEqual(expect.arrayContaining(['nodejs', 'vuejs']))
    })

    it('is successfully finding and counting all members, and tags [nodejs]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const nodeTag = await mockIRepositoryOptions.database.tag.create({
        name: 'nodejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
          tags: [nodeTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          tags: [nodeTag.id, vueTag.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                tags: {
                  contains: [nodeTag.id],
                },
              },
            ],
          },
        },
        mockIRepositoryOptions,
      )
      const member1 = members.rows.find((m) => m.username[PlatformType.GITHUB].includes('test1'))
      const member2 = members.rows.find((m) => m.username[PlatformType.GITHUB].includes('test2'))

      expect(members.rows.length).toEqual(2)
      expect(member1.tags[0].name).toEqual('nodejs')
      expect(member2.tags.map((t) => t.name)).toEqual(expect.arrayContaining(['nodejs', 'vuejs']))
    })

    it('is successfully finding and counting all members, and organisations [crowd.dev, pied piper]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const crowd = await OrganizationRepository.create(
        {
          identities: [
            {
              name: 'crowd.dev',
              url: 'https://crowd.dev',
              platform: 'crowd',
            },
          ],
          displayName: 'crowd.dev',
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
        },
        mockIRepositoryOptions,
      )
      const pp = await OrganizationRepository.create(
        {
          identities: [
            {
              name: 'pied piper',
              url: 'https://piedpiper.com',
              platform: 'crowd',
            },
          ],
          displayName: 'pied piper',
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
        },
        mockIRepositoryOptions,
      )

      await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          score: '1',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 2',
          score: '6',
          joinedAt: new Date(),
          organizations: [crowd.id, pp.id],
        },
        mockIRepositoryOptions,
      )
      await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 3',
          score: '7',
          joinedAt: new Date(),
        },
        mockIRepositoryOptions,
      )

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                organizations: {
                  contains: [crowd.id, pp.id],
                },
              },
            ],
          },
        },
        mockIRepositoryOptions,
      )
      const member2 = members.rows.find((m) => m.username[PlatformType.SLACK].includes('test2'))
      expect(members.rows.length).toEqual(1)
      expect(member2.organizations.map((o) => o.displayName)).toEqual(
        expect.arrayContaining(['crowd.dev', 'pied piper']),
      )
    })

    it('is successfully finding and counting all members, and scoreRange is gte than 7', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const user1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        score: '1',
        joinedAt: new Date(),
      }
      const user2 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test2',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 2',
        score: '6',
        joinedAt: new Date(),
      }
      const user3 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test3',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 3',
        score: '7',
        joinedAt: new Date(),
      }
      await MemberRepository.create(user1, mockIRepositoryOptions)
      await MemberRepository.create(user2, mockIRepositoryOptions)
      await MemberRepository.create(user3, mockIRepositoryOptions)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    score: {
                      gte: 7,
                    },
                  },
                ],
              },
            ],
          },
        },
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
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })
      const vueTag = await mockIRepositoryOptions.database.tag.create({
        name: 'vuejs',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
      })

      const member1 = await MemberRepository.create(
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
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
          username: {
            [PlatformType.SLACK]: {
              username: 'test2',
              integrationId: generateUUIDv1(),
            },
          },
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
          username: {
            [PlatformType.SLACK]: {
              username: 'test3',
              integrationId: generateUUIDv1(),
            },
          },
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member1.id,
          username: member1.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member2.id,
          username: member2.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member2.id,
          username: member2.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          memberId: member3.id,
          username: member3.username[PlatformType.SLACK],
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

      let members = await MemberRepository.findAndCountAllv2(
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
      members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    reach: {
                      gte: 55,
                    },
                  },
                ],
              },
            ],
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
      members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    activityCount: {
                      gte: 2,
                    },
                  },
                ],
              },
            ],
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
      members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    lastActive: {
                      gte: '2022-09-11',
                    },
                  },
                ],
              },
            ],
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
      members = await MemberRepository.findAndCountAllv2(
        {
          filter: {
            and: [
              {
                and: [
                  {
                    averageSentiment: {
                      gte: 0.2,
                    },
                  },
                ],
              },
            ],
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
        username: {
          [PlatformType.DISCORD]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      let cloned = lodash.cloneDeep(member1)
      const returnedMember = await MemberRepository.create(cloned, mockIRepositoryOptions)

      const updateFields = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil_github',
            integrationId: generateUUIDv1(),
          },
        },
        emails: ['lala@l.com'],
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

      cloned = lodash.cloneDeep(updateFields)
      const updatedMember = await MemberRepository.update(
        returnedMember.id,
        cloned,
        mockIRepositoryOptions,
      )

      // check updatedAt field looks ok or not. Should be greater than createdAt
      expect(updatedMember.updatedAt.getTime()).toBeGreaterThan(updatedMember.createdAt.getTime())

      updatedMember.createdAt = updatedMember.createdAt.toISOString().split('T')[0]
      updatedMember.updatedAt = updatedMember.updatedAt.toISOString().split('T')[0]

      const expectedMemberCreated = {
        id: returnedMember.id,
        username: mapUsername({
          ...updateFields.username,
          ...member1.username,
        }),
        identities: ['discord', 'github'],
        displayName: returnedMember.displayName,
        attributes: updateFields.attributes,
        emails: updateFields.emails,
        score: updateFields.score,
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        organizations: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        notes: [],
        tasks: [],
        activeOn: [],
        activityTypes: [],
        joinedAt: new Date(updateFields.joinedAt),
        tags: [],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        activeDaysCount: 0,
        averageSentiment: 0,
        numberOfOpenSourceContributions: 0,
        lastActive: null,
        lastActivity: null,
        affiliations: [],
        manuallyCreated: false,
      }

      expect(updatedMember).toStrictEqual(expectedMemberCreated)
    })

    it('Should update successfuly but return without relations when doPopulateRelations=false', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        score: '1',
        joinedAt: '2021-05-27T15:14:30Z',
      }
      const returnedMember = await MemberRepository.create(member1, mockIRepositoryOptions)

      const updateFields = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'anil_github',
            integrationId: generateUUIDv1(),
          },
        },
        emails: ['lala@l.com'],
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
        username: mapUsername({
          [PlatformType.DISCORD]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
          [PlatformType.GITHUB]: {
            username: 'anil_github',
            integrationId: generateUUIDv1(),
          },
        }),
        displayName: returnedMember.displayName,
        attributes: updateFields.attributes,
        lastEnriched: null,
        enrichedBy: [],
        organizations: [],
        contributions: null,
        emails: updateFields.emails,
        score: updateFields.score,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        joinedAt: new Date(updateFields.joinedAt),
        affiliations: [],
        manuallyCreated: false,
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
          username: {
            [PlatformType.DISCORD]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
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
        emails: member1.emails,
        score: member1.score,
        organizations: [],
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        reach: { total: -1 },
        notes: [],
        tasks: [],
        activeOn: [],
        activityTypes: [],
        joinedAt: new Date(member1.joinedAt),
        tags: [tag1Plain, tag2Plain],
        noMerge: [],
        toMerge: [],
        activityCount: 0,
        activeDaysCount: 0,
        averageSentiment: 0,
        numberOfOpenSourceContributions: 0,
        lastActive: null,
        lastActivity: null,
        affiliations: [],
        manuallyCreated: false,
      }

      expect(member1).toStrictEqual(expectedMemberCreated)
    })

    it('Should successfully update member with given organizations', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const org1 = await OrganizationRepository.create(
        {
          displayName: 'crowd.dev',
          identities: [{ name: 'crowd.dev', url: 'https://crowd.dev', platform: 'crowd' }],
        },
        mockIRepositoryOptions,
      )
      const org2 = await OrganizationRepository.create(
        {
          displayName: 'pied piper',
          identities: [{ name: 'pied piper', url: 'https://piedpiper.com', platform: 'crowd' }],
        },
        mockIRepositoryOptions,
      )
      const org3 = await OrganizationRepository.create(
        {
          displayName: 'hooli',
          identities: [{ name: 'hooli', url: 'https://hooli.com', platform: 'crowd' }],
        },
        mockIRepositoryOptions,
      )

      // Create member with tag3
      let member1 = await MemberRepository.create(
        {
          username: {
            [PlatformType.DISCORD]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
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
        { organizations: [org1.id, org2.id], organizationsReplace: true },
        mockIRepositoryOptions,
      )

      member1.createdAt = member1.createdAt.toISOString().split('T')[0]
      member1.updatedAt = member1.updatedAt.toISOString().split('T')[0]

      member1.organizations = member1.organizations.map((i) =>
        SequelizeTestUtils.objectWithoutKey(i.get({ plain: true }), ['memberOrganizations']),
      )

      // // sort member organizations by createdAt
      // member1.organizations.sort((a, b) => {
      //   return a.createdAt < b.createdAt ? -1 : 1
      // })

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
        emails: member1.emails,
        score: member1.score,
        tags: [],
        lastEnriched: null,
        enrichedBy: [],
        contributions: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segments: mockIRepositoryOptions.currentSegments,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        activeOn: [],
        activityTypes: [],
        reach: { total: -1 },
        joinedAt: new Date(member1.joinedAt),
        organizations: [
          SequelizeTestUtils.objectWithoutKey(org1Plain, [
            'lastActive',
            'identities',
            'activeOn',
            'joinedAt',
            'activityCount',
            'segments',
            'weakIdentities',
          ]),
          SequelizeTestUtils.objectWithoutKey(org2Plain, [
            'lastActive',
            'identities',
            'activeOn',
            'joinedAt',
            'activityCount',
            'segments',
            'weakIdentities',
          ]),
        ],
        noMerge: [],
        toMerge: [],
        notes: [],
        tasks: [],
        activityCount: 0,
        activeDaysCount: 0,
        averageSentiment: 0,
        numberOfOpenSourceContributions: 0,
        lastActive: null,
        lastActivity: null,
        affiliations: [],
        manuallyCreated: false,
      }

      member1.organizations = member1.organizations.sort((a, b) => {
        if (a.displayName < b.displayName) {
          return -1
        }
        if (a.displayName > b.displayName) {
          return 1
        }
        return 0
      })

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
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
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

    it('Should succesfully update member with tasks', async () => {
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
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
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
      expect(memberUpdated.tasks.find((t) => t.id === tasks1.id)).not.toBeUndefined()
      expect(memberUpdated.tasks.find((t) => t.id === task2.id)).not.toBeUndefined()
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
          username: {
            [PlatformType.DISCORD]: {
              username: 'test1',
              integrationId: generateUUIDv1(),
            },
          },
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

    it('Should succesfully update member organization affiliations', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const segmentRepo = new SegmentRepository(mockIRepositoryOptions)

      const segment1 = await segmentRepo.create({
        name: 'Crowd.dev - Segment1',
        url: '',
        parentName: 'Crowd.dev - Segment1',
        grandparentName: 'Crowd.dev - Segment1',
        slug: 'crowd.dev-1',
        parentSlug: 'crowd.dev-1',
        grandparentSlug: 'crowd.dev-1',
        status: SegmentStatus.ACTIVE,
        sourceId: null,
        sourceParentId: null,
      })

      const segment2 = await segmentRepo.create({
        name: 'Crowd.dev - Segment2',
        url: '',
        parentName: 'Crowd.dev - Segment2',
        grandparentName: 'Crowd.dev - Segment2',
        slug: 'crowd.dev-2',
        parentSlug: 'crowd.dev-2',
        grandparentSlug: 'crowd.dev-2',
        status: SegmentStatus.ACTIVE,
        sourceId: null,
        sourceParentId: null,
      })

      const org1 = await OrganizationRepository.create(
        {
          displayName: 'crowd.dev',
        },
        mockIRepositoryOptions,
      )

      const member2add = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
        affiliations: [
          {
            segmentId: segment1.id,
            organizationId: org1.id,
          },
          {
            segmentId: segment2.id,
            organizationId: null,
          },
        ],
      }

      const memberCreated = await MemberRepository.create(member2add, mockIRepositoryOptions)
      expect(memberCreated.affiliations).toHaveLength(2)

      // removes segment1 affiliation, and set segment2 affilition to org1
      const memberUpdated = await MemberRepository.update(
        memberCreated.id,
        {
          affiliations: [
            {
              segmentId: segment2.id,
              organizationId: org1.id,
            },
          ],
        },
        mockIRepositoryOptions,
      )

      expect(memberUpdated.affiliations.filter((a) => a.segmentId === segment1.id)).toHaveLength(0)
      expect(
        memberUpdated.affiliations.filter((a) => a.segmentId === segment2.id)[0].organizationId,
      ).toEqual(org1.id)
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'test1',
            integrationId: generateUUIDv1(),
          },
        },
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

  describe('removeToMerge method', () => {
    it('Should remove a member from other members toMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil2',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 2',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberCreated1 = await MemberRepository.create(member1, mockIRepositoryOptions)
      const memberCreated2 = await MemberRepository.create(member2, mockIRepositoryOptions)

      await MemberRepository.addToMerge(
        [{ members: [memberCreated1.id, memberCreated2.id], similarity: null }],
        mockIRepositoryOptions,
      )
      await MemberRepository.addToMerge(
        [{ members: [memberCreated2.id, memberCreated1.id], similarity: null }],
        mockIRepositoryOptions,
      )

      let m1 = await MemberRepository.findById(memberCreated1.id, mockIRepositoryOptions)
      const m2 = await MemberRepository.findById(memberCreated2.id, mockIRepositoryOptions)
      m1 = await MemberRepository.removeToMerge(
        memberCreated1.id,
        memberCreated2.id,
        mockIRepositoryOptions,
      )

      // Member2 should be removed from Member1.toMerge
      expect(m1.toMerge.length).toBe(0)

      // Member1 is still in member2.toMerge list
      expect(m2.toMerge[0]).toBe(m1.id)
    })
  })

  describe('addNoMerge method', () => {
    it('Should add a member to other members noMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil2',
            integrationId: generateUUIDv1(),
          },
        },
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
    let options
    let memberService

    let defaultMember

    beforeEach(async () => {
      options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(options)

      memberService = new MemberService(options)

      defaultMember = {
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      }
    })
    it('Should remove a member from other members noMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const member1 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const member2 = {
        username: {
          [PlatformType.DISCORD]: {
            username: 'anil2',
            integrationId: generateUUIDv1(),
          },
        },
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

  describe('work experiences', () => {
    let options
    let memberService
    let organizationService

    let defaultMember

    beforeEach(async () => {
      options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(options)

      memberService = new MemberService(options)
      organizationService = new OrganizationService(options)

      defaultMember = {
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      }
    })

    async function createMember(data = {}) {
      return await memberService.upsert({
        ...defaultMember,
        username: {
          [PlatformType.GITHUB]: uuid(),
        },
        ...data,
      })
    }

    async function createOrg(name, data = {}) {
      return await organizationService.createOrUpdate({
        identities: [
          {
            name,
            platform: 'crowd',
          },
        ],
        ...data,
      })
    }

    async function addWorkExperience(memberId, orgId, data = {}) {
      return await MemberRepository.createOrUpdateWorkExperience(
        {
          memberId,
          organizationId: orgId,
          source: 'test',
          ...data,
        },
        options,
      )
    }

    async function findMember(id) {
      return await memberService.findById(id)
    }

    function formatDate(value) {
      if (!value) {
        return null
      }
      return moment(value).format('YYYY-MM-DD')
    }

    it('Should not create multiple work experiences for same org without dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id)
      await addWorkExperience(member.id, org.id)

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
    })

    it('Should not create multiple work experiences for same org with same start dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
      })
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
      })

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
    })

    it('Should not create multiple work experiences for same org with same dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
        dateEnd: '2020-01-05',
      })
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
        dateEnd: '2020-01-05',
      })

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
    })

    it('Should create multiple work experiences for same org with different dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
      })
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-08',
      })
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
        dateEnd: '2020-01-05',
      })
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-06',
        dateEnd: '2020-01-07',
      })

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(4)
    })

    it('Should clean up work experiences without dates once we get start dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id)
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
      })

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
      const dates = member.organizations[0].memberOrganizations.dataValues
      expect(formatDate(dates.dateStart)).toBe('2020-01-01')
      expect(formatDate(dates.dateEnd)).toBeNull()
    })
    it('Should clean up work experiences without dates once we get both dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id)
      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
        dateEnd: '2020-07-01',
      })

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
      const dates = member.organizations[0].memberOrganizations.dataValues
      expect(formatDate(dates.dateStart)).toBe('2020-01-01')
      expect(formatDate(dates.dateEnd)).toBe('2020-07-01')
    })
    it('Should not add new work experiences without dates if we have start dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
      })
      await addWorkExperience(member.id, org.id)

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
      const dates = member.organizations[0].memberOrganizations.dataValues
      expect(formatDate(dates.dateStart)).toBe('2020-01-01')
      expect(formatDate(dates.dateEnd)).toBeNull()
    })
    it('Should not add new work experiences without dates if we have both dates', async () => {
      let member = await createMember()

      const org = await createOrg('org')

      await addWorkExperience(member.id, org.id, {
        dateStart: '2020-01-01',
        dateEnd: '2020-07-01',
      })
      await addWorkExperience(member.id, org.id)

      member = await findMember(member.id)

      expect(member.organizations.length).toBe(1)
      const dates = member.organizations[0].memberOrganizations.dataValues
      expect(formatDate(dates.dateStart)).toBe('2020-01-01')
      expect(formatDate(dates.dateEnd)).toBe('2020-07-01')
    })
  })
})
