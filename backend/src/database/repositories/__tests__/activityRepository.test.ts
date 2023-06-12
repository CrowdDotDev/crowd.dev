import MemberRepository from '../memberRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import ActivityRepository from '../activityRepository'
import { PlatformType } from '@crowd/types'
import TaskRepository from '../taskRepository'
import { MemberAttributeName } from '../../attributes/member/enums'
import MemberAttributeSettingsRepository from '../memberAttributeSettingsRepository'
import MemberAttributeSettingsService from '../../../services/memberAttributeSettingsService'
import { DefaultMemberAttributes } from '../../attributes/member/default'
import { UNKNOWN_ACTIVITY_TYPE_DISPLAY } from '@crowd/integrations'

const db = null

describe('ActivityRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create the given activity succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
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
          sentiment: 0.98,
        },
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      const activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityCreated.createdAt = activityCreated.createdAt.toISOString().split('T')[0]
      activityCreated.updatedAt = activityCreated.updatedAt.toISOString().split('T')[0]
      delete activityCreated.member
      delete activityCreated.objectMember

      const expectedActivityCreated = {
        id: activityCreated.id,
        attributes: activity.attributes,
        body: 'Here',
        type: 'activity',
        title: 'Title',
        url: 'https://github.com',
        channel: 'channel',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        timestamp: new Date('2020-05-27T15:13:30Z'),
        platform: PlatformType.GITHUB,
        isContribution: true,
        score: 1,
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        tasks: [],
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parent: null,
        parentId: null,
        sourceId: activity.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      expect(activityCreated).toStrictEqual(expectedActivityCreated)
    })

    it('Should create a bare-bones activity succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        member: memberCreated.id,
        username: 'test',
        sourceId: '#sourceId1',
      }

      const activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityCreated.createdAt = activityCreated.createdAt.toISOString().split('T')[0]
      activityCreated.updatedAt = activityCreated.updatedAt.toISOString().split('T')[0]
      delete activityCreated.member
      delete activityCreated.objectMember

      const expectedActivityCreated = {
        id: activityCreated.id,
        attributes: {},
        body: null,
        title: null,
        url: null,
        channel: null,
        sentiment: {},
        type: 'activity',
        timestamp: new Date('2020-05-27T15:13:30Z'),
        platform: PlatformType.GITHUB,
        isContribution: false,
        score: 2,
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        tasks: [],
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parent: null,
        parentId: null,
        sourceId: activityCreated.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      expect(activityCreated).toStrictEqual(expectedActivityCreated)
    })

    it('Should throw error when no platform given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        attributes: {
          replies: 12,
        },
        body: 'Here',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
      }

      await expect(() =>
        ActivityRepository.create(activity, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should throw error when no type given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        platform: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        attributes: {
          replies: 12,
        },
        username: 'test',
        body: 'Here',
        isContribution: true,
        member: memberCreated.id,
        score: 1,
      }

      await expect(() =>
        ActivityRepository.create(activity, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should throw error when no timestamp given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        platform: PlatformType.GITHUB,
        type: 'activity',
        attributes: {
          replies: 12,
        },
        username: 'test',
        body: 'Here',
        isContribution: true,
        member: memberCreated.id,
        score: 1,
      }

      await expect(() =>
        ActivityRepository.create(activity, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should throw error when sentiment is incorrect', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      // Incomplete Object
      await expect(() =>
        ActivityRepository.create(
          {
            type: 'activity',
            timestamp: '2020-05-27T15:13:30Z',
            platform: PlatformType.GITHUB,
            sentiment: {
              positive: 1,
              sentiment: 'positive',
              score: 1,
            },
            username: 'test',
            member: memberCreated.id,
            sourceId: '#sourceId1',
          },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()

      // No score
      await expect(() =>
        ActivityRepository.create(
          {
            type: 'activity',
            timestamp: '2020-05-27T15:13:30Z',
            platform: PlatformType.GITHUB,
            sentiment: {
              positive: 0.8,
              negative: 0.2,
              mixed: 0,
              neutral: 0,
              sentiment: 'positive',
            },
            username: 'test',
            member: memberCreated.id,
            sourceId: '#sourceId1',
          },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()

      // Wrong Sentiment field
      await expect(() =>
        ActivityRepository.create(
          {
            type: 'activity',
            timestamp: '2020-05-27T15:13:30Z',
            platform: PlatformType.GITHUB,
            sentiment: {
              positive: 0.3,
              negative: 0.2,
              neutral: 0.5,
              mixed: 0,
              score: 0.1,
              sentiment: 'smth',
            },
            username: 'test',
            member: memberCreated.id,
            sourceId: '#sourceId1',
          },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()

      // Works with empty object
      const created = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          sentiment: {},
          username: 'test',
          member: memberCreated.id,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )
      expect(created.sentiment).toStrictEqual({})
    })

    it('Should leave allowed HTML tags in body and title', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: '<p> This is some HTML </p>',
        title: '<h1> This is some Title HTML </h1>',
        url: 'https://github.com',
        channel: 'channel',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      const activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityCreated.createdAt = activityCreated.createdAt.toISOString().split('T')[0]
      activityCreated.updatedAt = activityCreated.updatedAt.toISOString().split('T')[0]
      delete activityCreated.member
      delete activityCreated.objectMember

      const expectedActivityCreated = {
        id: activityCreated.id,
        attributes: {},
        body: '<p> This is some HTML </p>',
        type: 'activity',
        title: '<h1> This is some Title HTML </h1>',
        url: 'https://github.com',
        channel: 'channel',
        sentiment: {},
        timestamp: new Date('2020-05-27T15:13:30Z'),
        platform: PlatformType.GITHUB,
        isContribution: true,
        score: 1,
        tasks: [],
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parent: null,
        parentId: null,
        sourceId: activity.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      expect(activityCreated).toStrictEqual(expectedActivityCreated)
    })

    it('Should remove script tags in body and title', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: "<script> console.log('gotcha')</script> <p> Malicious </p>",
        title: "<script> console.log('title gotcha')</script> <h1> Malicious title </h1>",
        url: 'https://github.com',
        channel: 'channel',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      const activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityCreated.createdAt = activityCreated.createdAt.toISOString().split('T')[0]
      activityCreated.updatedAt = activityCreated.updatedAt.toISOString().split('T')[0]
      delete activityCreated.member
      delete activityCreated.objectMember

      const expectedActivityCreated = {
        id: activityCreated.id,
        attributes: {},
        body: '<p> Malicious </p>',
        type: 'activity',
        title: '<h1> Malicious title </h1>',
        url: 'https://github.com',
        channel: 'channel',
        sentiment: {},
        tasks: [],
        timestamp: new Date('2020-05-27T15:13:30Z'),
        platform: PlatformType.GITHUB,
        isContribution: true,
        score: 1,
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parent: null,
        parentId: null,
        sourceId: activity.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      expect(activityCreated).toStrictEqual(expectedActivityCreated)
    })

    it('Should create an activity with tasks succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

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

      const activity = {
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
          sentiment: 0.98,
        },
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        tasks: [tasks1.id, task2.id],
        sourceId: '#sourceId1',
      }

      const activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      expect(activityCreated.tasks.length).toBe(2)
    })
  })

  describe('findById method', () => {
    it('Should successfully find created activity by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      const activityCreated = await ActivityRepository.create(activity, mockIRepositoryOptions)

      const expectedActivityFound = {
        id: activityCreated.id,
        attributes: {},
        body: null,
        title: null,
        url: null,
        channel: null,
        sentiment: {},
        type: 'activity',
        timestamp: new Date('2020-05-27T15:13:30Z'),
        platform: PlatformType.GITHUB,
        isContribution: true,
        score: 1,
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        tasks: [],
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parent: null,
        parentId: null,
        sourceId: activity.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      const activityFound = await ActivityRepository.findById(
        activityCreated.id,
        mockIRepositoryOptions,
      )

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityFound.createdAt = activityFound.createdAt.toISOString().split('T')[0]
      activityFound.updatedAt = activityFound.updatedAt.toISOString().split('T')[0]
      delete activityFound.member
      delete activityFound.objectMember

      expect(activityFound).toStrictEqual(expectedActivityFound)
    })

    it('Should throw 404 error when no user found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        ActivityRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created activity entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity1Returned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          username: 'test',
          member: memberCreated.id,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const activity2Returned = await ActivityRepository.create(
        {
          type: 'activity-2',
          timestamp: '2020-06-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          username: 'test',
          member: memberCreated.id,
          sourceId: '#sourceId2',
        },
        mockIRepositoryOptions,
      )

      const filterIdsReturned = await ActivityRepository.filterIdsInTenant(
        [activity1Returned.id, activity2Returned.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([activity1Returned.id, activity2Returned.id])
    })

    it('Should only return the ids of previously created activities and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity3Returned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          username: 'test',
          member: memberCreated.id,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await ActivityRepository.filterIdsInTenant(
        [activity3Returned.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([activity3Returned.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity4Returned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          username: 'test',
          member: memberCreated.id,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      // create a new tenant and bind options to it
      const mockIRepositoryOptionsIr = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await ActivityRepository.filterIdsInTenant(
        [activity4Returned.id],
        mockIRepositoryOptionsIr,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('Activities findOne method', () => {
    it('Should return the created activity for a simple query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const found = await ActivityRepository.findOne({ type: 'activity' }, mockIRepositoryOptions)

      expect(found.id).toStrictEqual(activityReturned.id)
    })

    it('Should return the activity for a complex query', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            thread: true,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const found = await ActivityRepository.findOne(
        { 'attributes.thread': true },
        mockIRepositoryOptions,
      )

      expect(found.id).toStrictEqual(activityReturned.id)
    })

    it('Should return null when non-existent', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            replies: 12,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      expect(
        await ActivityRepository.findOne({ type: 'notype' }, mockIRepositoryOptions),
      ).toBeNull()
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created activity - simple', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            replies: 12,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const updateFields = {
        type: 'activity-new',
        platform: PlatformType.GITHUB,
      }

      const updatedActivity = await ActivityRepository.update(
        activityReturned.id,
        updateFields,
        mockIRepositoryOptions,
      )

      // check updatedAt field looks ok or not. Should be greater than createdAt
      expect(updatedActivity.updatedAt.getTime()).toBeGreaterThan(
        updatedActivity.createdAt.getTime(),
      )

      updatedActivity.createdAt = updatedActivity.createdAt.toISOString().split('T')[0]
      updatedActivity.updatedAt = updatedActivity.updatedAt.toISOString().split('T')[0]
      delete updatedActivity.member
      delete updatedActivity.objectMember

      const expectedActivityUpdated = {
        id: activityReturned.id,
        body: activityReturned.body,
        channel: null,
        title: null,
        sentiment: {},
        url: null,
        attributes: activityReturned.attributes,
        type: 'activity-new',
        timestamp: new Date('2020-05-27T15:13:30Z'),
        platform: PlatformType.GITHUB,
        isContribution: true,
        score: 1,
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        tasks: [],
        parent: null,
        parentId: null,
        sourceId: activityReturned.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      expect(updatedActivity).toStrictEqual(expectedActivityUpdated)
    })

    it('Should succesfully update previously created activity - with member relation', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const memberCreated2 = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test2',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            replies: 12,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const updateFields = {
        type: 'activity-new',
        platform: PlatformType.GITHUB,
        body: 'There',
        title: 'Title',
        channel: 'Channel',
        url: 'https://www.google.com',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        username: 'test2',
        member: memberCreated2.id,
      }

      const updatedActivity = await ActivityRepository.update(
        activityReturned.id,
        updateFields,
        mockIRepositoryOptions,
      )

      // check updatedAt field looks ok or not. Should be greater than createdAt
      expect(updatedActivity.updatedAt.getTime()).toBeGreaterThan(
        updatedActivity.createdAt.getTime(),
      )

      updatedActivity.createdAt = updatedActivity.createdAt.toISOString().split('T')[0]
      updatedActivity.updatedAt = updatedActivity.updatedAt.toISOString().split('T')[0]
      delete updatedActivity.member
      delete updatedActivity.objectMember

      const expectedActivityUpdated = {
        id: activityReturned.id,
        attributes: activityReturned.attributes,
        body: updateFields.body,
        channel: updateFields.channel,
        title: updateFields.title,
        sentiment: updateFields.sentiment,
        url: updateFields.url,
        type: 'activity-new',
        timestamp: new Date('2020-05-27T15:13:30Z'),
        tasks: [],
        platform: PlatformType.GITHUB,
        isContribution: true,
        score: 1,
        username: 'test2',
        objectMemberUsername: null,
        memberId: memberCreated2.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parent: null,
        parentId: null,
        sourceId: activityReturned.sourceId,
        sourceParentId: null,
        conversationId: null,
        display: UNKNOWN_ACTIVITY_TYPE_DISPLAY,
        organizationId: null,
        organization: null,
      }

      expect(updatedActivity).toStrictEqual(expectedActivityUpdated)
    })

    it('Should succesfully update tasks of an activity', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            replies: 12,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

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

      const updateFields = {
        tasks: [tasks1.id, task2.id],
      }

      const updatedActivity = await ActivityRepository.update(
        activityReturned.id,
        updateFields,
        mockIRepositoryOptions,
      )

      expect(updatedActivity.tasks).toHaveLength(2)
      expect(updatedActivity.tasks[0].id).toBe(tasks1.id)
      expect(updatedActivity.tasks[1].id).toBe(task2.id)
    })

    it('Should update body and title with allowed HTML tags', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            replies: 12,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const updateFields = {
        body: '<p> This is some HTML </p>',
        title: '<h1> This is some Title HTML </h1>',
      }

      const updatedActivity = await ActivityRepository.update(
        activityReturned.id,
        updateFields,
        mockIRepositoryOptions,
      )

      expect(updatedActivity.body).toBe('<p> This is some HTML </p>')
      expect(updatedActivity.title).toBe('<h1> This is some Title HTML </h1>')
    })

    it('Should sanitize body and title from non-allowed HTML tags', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activityReturned = await ActivityRepository.create(
        {
          type: 'activity',
          timestamp: '2020-05-27T15:13:30Z',
          platform: PlatformType.GITHUB,
          attributes: {
            replies: 12,
          },
          body: 'Here',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          sourceId: '#sourceId1',
        },
        mockIRepositoryOptions,
      )

      const updateFields = {
        body: "<script> console.log('gotcha')</script> <p> Malicious </p>",
        title: "<script> console.log('title gotcha')</script> <h1> Malicious title </h1>",
      }

      const updatedActivity = await ActivityRepository.update(
        activityReturned.id,
        updateFields,
        mockIRepositoryOptions,
      )

      expect(updatedActivity.body).toBe('<p> Malicious </p>')
      expect(updatedActivity.title).toBe('<h1> Malicious title </h1>')
    })
  })

  describe('filter tests', () => {
    it('Positive sentiment filter and sort', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity1 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        username: 'test',
        member: memberCreated.id,
        sourceId: '#sourceId1',
      }

      const activity2 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.55,
          negative: 0.0,
          neutral: 0.45,
          mixed: 0.0,
          label: 'neutral',
          sentiment: 0.55,
        },
        username: 'test',
        member: memberCreated.id,
        sourceId: '#sourceId2',
      }

      const activityCreated1 = await ActivityRepository.create(activity1, mockIRepositoryOptions)
      await ActivityRepository.create(activity2, mockIRepositoryOptions)

      // Control
      expect(
        (await ActivityRepository.findAndCountAll({ filter: {} }, mockIRepositoryOptions)).count,
      ).toBe(2)

      // Filter by how positive activities are
      const filteredActivities = await ActivityRepository.findAndCountAll(
        { filter: { positiveSentimentRange: [0.6, 1] } },
        mockIRepositoryOptions,
      )

      expect(filteredActivities.count).toBe(1)
      expect(filteredActivities.rows[0].id).toBe(activityCreated1.id)

      // Filter by whether activities are positive or not
      const filteredActivities2 = await ActivityRepository.findAndCountAll(
        { filter: { sentimentLabel: 'positive' } },
        mockIRepositoryOptions,
      )

      expect(filteredActivities2.count).toBe(1)
      expect(filteredActivities2.rows[0].id).toBe(activityCreated1.id)

      // No filter, but sorting
      const filteredActivities3 = await ActivityRepository.findAndCountAll(
        { filter: {}, orderBy: 'sentiment.positive_DESC' },
        mockIRepositoryOptions,
      )
      expect(filteredActivities3.count).toBe(2)
      expect(filteredActivities3.rows[0].sentiment.positive).toBeGreaterThan(
        filteredActivities3.rows[1].sentiment.positive,
      )
    })
    it('Negative sentiment filter and sort', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity1 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        username: 'test',
        member: memberCreated.id,
        sourceId: '#sourceId1',
      }

      const activity2 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.01,
          negative: 0.55,
          neutral: 0.55,
          mixed: 0.0,
          label: 'negative',
          sentiment: -0.54,
        },
        username: 'test',
        member: memberCreated.id,
        sourceId: '#sourceId2',
      }

      await ActivityRepository.create(activity1, mockIRepositoryOptions)
      const activityCreated2 = await ActivityRepository.create(activity2, mockIRepositoryOptions)

      // Control
      expect(
        (await ActivityRepository.findAndCountAll({ filter: {} }, mockIRepositoryOptions)).count,
      ).toBe(2)

      // Filter by how positive activities are
      const filteredActivities = await ActivityRepository.findAndCountAll(
        { filter: { negativeSentimentRange: [0.5, 1] } },
        mockIRepositoryOptions,
      )

      expect(filteredActivities.count).toBe(1)
      expect(filteredActivities.rows[0].id).toBe(activityCreated2.id)

      // Filter by whether activities are positive or not
      const filteredActivities2 = await ActivityRepository.findAndCountAll(
        { filter: { sentimentLabel: 'negative' } },
        mockIRepositoryOptions,
      )

      expect(filteredActivities2.count).toBe(1)
      expect(filteredActivities2.rows[0].id).toBe(activityCreated2.id)

      // No filter, but sorting
      const filteredActivities3 = await ActivityRepository.findAndCountAll(
        { filter: {}, orderBy: 'sentiment.negative_DESC' },
        mockIRepositoryOptions,
      )
      expect(filteredActivities3.count).toBe(2)
      expect(filteredActivities3.rows[0].sentiment.negative).toBeGreaterThan(
        filteredActivities3.rows[1].sentiment.negative,
      )
    })

    it('Overall sentiment filter and sort', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            github: 'test',
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity1 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        username: 'test',
        member: memberCreated.id,
        sourceId: '#sourceId1',
      }

      const activity2 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.55,
          negative: 0.0,
          neutral: 0.45,
          mixed: 0.0,
          label: 'neutral',
          sentiment: 0.55,
        },
        username: 'test',
        member: memberCreated.id,
        sourceId: '#sourceId2',
      }

      const activityCreated1 = await ActivityRepository.create(activity1, mockIRepositoryOptions)
      await ActivityRepository.create(activity2, mockIRepositoryOptions)

      // Control
      expect(
        (await ActivityRepository.findAndCountAll({ filter: {} }, mockIRepositoryOptions)).count,
      ).toBe(2)

      // Filter by how positive activities are
      const filteredActivities = await ActivityRepository.findAndCountAll(
        { filter: { sentimentRange: [0.6, 1] } },
        mockIRepositoryOptions,
      )

      expect(filteredActivities.count).toBe(1)
      expect(filteredActivities.rows[0].id).toBe(activityCreated1.id)

      // No filter, but sorting
      const filteredActivities3 = await ActivityRepository.findAndCountAll(
        { filter: {}, orderBy: 'sentiment_DESC' },
        mockIRepositoryOptions,
      )
      expect(filteredActivities3.count).toBe(2)
      expect(filteredActivities3.rows[0].sentiment.positive).toBeGreaterThan(
        filteredActivities3.rows[1].sentiment.positive,
      )
    })

    it('Member related attributes filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mas = new MemberAttributeSettingsService(mockIRepositoryOptions)

      await mas.createPredefined(DefaultMemberAttributes)

      const memberAttributeSettings = (
        await MemberAttributeSettingsRepository.findAndCountAll({}, mockIRepositoryOptions)
      ).rows

      const memberCreated1 = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'test',
          },
          displayName: 'Anil',
          attributes: {
            [MemberAttributeName.IS_TEAM_MEMBER]: {
              default: true,
              [PlatformType.CROWD]: true,
            },
            [MemberAttributeName.LOCATION]: {
              default: 'Berlin',
              [PlatformType.GITHUB]: 'Berlin',
              [PlatformType.SLACK]: 'Turkey',
            },
          },
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const memberCreated2 = await MemberRepository.create(
        {
          username: {
            [PlatformType.GITHUB]: 'Michael',
          },
          displayName: 'Michael',
          attributes: {
            [MemberAttributeName.IS_TEAM_MEMBER]: {
              default: false,
              [PlatformType.CROWD]: false,
            },
            [MemberAttributeName.LOCATION]: {
              default: 'Scranton',
              [PlatformType.GITHUB]: 'Scranton',
              [PlatformType.SLACK]: 'New York',
            },
          },
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIRepositoryOptions,
      )

      const activity1 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        username: 'test',
        member: memberCreated1.id,
        sourceId: '#sourceId1',
      }

      const activity2 = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        sentiment: {
          positive: 0.55,
          negative: 0.0,
          neutral: 0.45,
          mixed: 0.0,
          label: 'neutral',
          sentiment: 0.55,
        },
        username: 'Michael',
        member: memberCreated2.id,
        sourceId: '#sourceId2',
      }

      const activityCreated1 = await ActivityRepository.create(activity1, mockIRepositoryOptions)
      const activityCreated2 = await ActivityRepository.create(activity2, mockIRepositoryOptions)

      // Control
      expect(
        (await ActivityRepository.findAndCountAll({ filter: {} }, mockIRepositoryOptions)).count,
      ).toBe(2)

      // Filter by member.isTeamMember
      let filteredActivities = await ActivityRepository.findAndCountAll(
        {
          advancedFilter: {
            member: {
              isTeamMember: {
                not: false,
              },
            },
          },
          attributesSettings: memberAttributeSettings,
        },
        mockIRepositoryOptions,
      )

      expect(filteredActivities.count).toBe(1)
      expect(filteredActivities.rows[0].id).toBe(activityCreated1.id)

      filteredActivities = await ActivityRepository.findAndCountAll(
        {
          advancedFilter: {
            member: {
              'attributes.location.slack': 'New York',
            },
          },
          attributesSettings: memberAttributeSettings,
        },
        mockIRepositoryOptions,
      )

      expect(filteredActivities.count).toBe(1)
      expect(filteredActivities.rows[0].id).toBe(activityCreated2.id)
    })
  })
})
