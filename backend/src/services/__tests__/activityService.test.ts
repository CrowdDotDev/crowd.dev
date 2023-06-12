import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import MemberService from '../memberService'
import ActivityService from '../activityService'
import MemberRepository from '../../database/repositories/memberRepository'
import ActivityRepository from '../../database/repositories/activityRepository'
import ConversationService from '../conversationService'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { PlatformType } from '@crowd/types'
import SettingsRepository from '../../database/repositories/settingsRepository'
import ConversationSettingsRepository from '../../database/repositories/conversationSettingsRepository'
import { MemberAttributeName } from '../../database/attributes/member/enums'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import { GithubMemberAttributes } from '../../database/attributes/member/github'
import { TwitterMemberAttributes } from '../../database/attributes/member/twitter'
import { IServiceOptions } from '../../services/IServiceOptions'
import { populateSegments, switchSegments } from '../../database/utils/segmentTestUtils'
import SegmentRepository from '../../database/repositories/segmentRepository'
import OrganizationRepository from '../../database/repositories/organizationRepository'
import { SegmentStatus } from '../../types/segmentTypes'

const db = null
const searchEngine = null

describe('ActivityService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('upsert method', () => {
    it('Should create non existent activity with no parent', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Body',
        title: 'Title',
        url: 'URL',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        attributes: {
          replies: 12,
        },
        sourceId: '#sourceId',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
      }

      const activityCreated = await new ActivityService(mockIRepositoryOptions).upsert(activity)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityCreated.createdAt = activityCreated.createdAt.toISOString().split('T')[0]
      activityCreated.updatedAt = activityCreated.updatedAt.toISOString().split('T')[0]
      delete activityCreated.member
      delete activityCreated.objectMember

      const expectedActivityCreated = {
        id: activityCreated.id,
        attributes: activity.attributes,
        type: 'activity',
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
        channel: null,
        body: 'Body',
        title: 'Title',
        url: 'URL',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        tasks: [],
        parent: null,
        parentId: null,
        conversationId: null,
        sourceId: activity.sourceId,
        sourceParentId: null,
        display: {
          default: activityCreated.type,
          short: activityCreated.type,
          channel: '',
        },
        organizationId: null,
        organization: null,
      }

      expect(activityCreated).toStrictEqual(expectedActivityCreated)
    })

    it('Should create non existent activity with parent', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activity1 = {
        type: 'question',
        timestamp: '2020-05-27T15:13:30Z',
        username: 'test',
        member: memberCreated.id,
        platform: 'non-existing-platform',
        body: 'What is love?',
        isContribution: true,
        score: 1,
        sourceId: 'sourceId#1',
      }

      const activityCreated1 = await new ActivityService(mockIRepositoryOptions).upsert(activity1)

      const activity2 = {
        type: 'answer',
        timestamp: '2020-05-28T15:13:30Z',
        platform: 'non-existing-platform',
        body: 'Baby dont hurt me',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 2,
        sourceId: 'sourceId#2',
        sourceParentId: activityCreated1.sourceId,
      }

      const activityCreated2 = await new ActivityService(mockIRepositoryOptions).upsert(activity2)

      // Since an activity with a parent is created, a Conversation entity should be created at this point
      // with both parent and the child activities. Try finding it using the slug

      const conversationCreated = await new ConversationService(
        mockIRepositoryOptions,
      ).findAndCountAll({ slug: 'what-is-love' })

      delete activityCreated2.member
      delete activityCreated2.parent
      delete activityCreated2.objectMember

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityCreated2.createdAt = activityCreated2.createdAt.toISOString().split('T')[0]
      activityCreated2.updatedAt = activityCreated2.updatedAt.toISOString().split('T')[0]

      const expectedActivityCreated = {
        id: activityCreated2.id,
        body: activity2.body,
        type: activity2.type,
        channel: null,
        attributes: {},
        sentiment: {
          positive: 0.42,
          negative: 0.42,
          neutral: 0.42,
          mixed: 0.42,
          label: 'positive',
          sentiment: 0.42,
        },
        url: null,
        title: null,
        timestamp: new Date(activity2.timestamp),
        platform: activity2.platform,
        isContribution: activity2.isContribution,
        score: activity2.score,
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
        parentId: activityCreated1.id,
        sourceParentId: activity1.sourceId,
        sourceId: activity2.sourceId,
        conversationId: conversationCreated.rows[0].id,
        display: {
          default: activity2.type,
          short: activity2.type,
          channel: '',
        },
        organizationId: null,
        organization: null,
      }

      expect(activityCreated2).toStrictEqual(expectedActivityCreated)
    })

    it('Should update already existing activity succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activity1 = {
        type: 'question',
        timestamp: '2020-05-27T15:13:30Z',
        username: 'test',
        member: memberCreated.id,
        body: 'What is love?',
        title: 'Song',
        platform: 'non-existing-platform',
        attributes: {
          nested_1: {
            attribute_1: '1',
            nested_2: {
              attribute_2: '2',
              attribute_array: [1, 2, 3],
            },
          },
        },
        isContribution: true,
        score: 1,
        sourceId: '#sourceId1',
      }

      const activityCreated1 = await new ActivityService(mockIRepositoryOptions).upsert(activity1)

      const activity2 = {
        type: 'question',
        timestamp: '2020-05-27T15:13:30Z',
        username: 'test',
        member: memberCreated.id,
        platform: 'non-existing-platform',
        body: 'Test',
        attributes: {
          nested_1: {
            attribute_1: '1',
            nested_2: {
              attribute_2: '5',
              attribute_3: 'test',
              attribute_array: [3, 4, 5],
            },
          },
          one: 'Baby dont hurt me',
          two: 'Dont hurt me',
          three: 'No more',
        },
        isContribution: false,
        score: 2,
        sourceId: '#sourceId1',
      }

      const activityUpserted = await new ActivityService(mockIRepositoryOptions).upsert(activity2)

      // Trim the hour part from timestamp so we can atleast test if the day is correct for createdAt and joinedAt
      activityUpserted.createdAt = activityUpserted.createdAt.toISOString().split('T')[0]
      activityUpserted.updatedAt = activityUpserted.updatedAt.toISOString().split('T')[0]

      // delete models before expect because we already have ids (memberId, parentId)
      delete activityUpserted.member
      delete activityUpserted.parent
      delete activityUpserted.objectMember

      const attributesExpected = {
        ...activity1.attributes,
        ...activity2.attributes,
      }

      attributesExpected.nested_1.nested_2.attribute_array = [1, 2, 3, 4, 5]

      const expectedActivityCreated = {
        id: activityCreated1.id,
        attributes: attributesExpected,
        type: activity2.type,
        timestamp: new Date(activity2.timestamp),
        platform: activity2.platform,
        isContribution: activity2.isContribution,
        score: activity2.score,
        title: activity1.title,
        sentiment: {
          positive: 0.42,
          negative: 0.42,
          neutral: 0.42,
          mixed: 0.42,
          label: 'positive',
          sentiment: 0.42,
        },
        url: null,
        body: activity2.body,
        channel: null,
        username: 'test',
        objectMemberUsername: null,
        memberId: memberCreated.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tasks: [],
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parentId: null,
        sourceParentId: null,
        sourceId: activity1.sourceId,
        conversationId: null,
        display: {
          default: activity2.type,
          short: activity2.type,
          channel: '',
        },
        organizationId: null,
        organization: null,
      }

      expect(activityUpserted).toStrictEqual(expectedActivityCreated)
    })

    it('Should create various conversations successfully with given parent-child relationships of activities [ascending timestamp order]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberService = new MemberService(mockIRepositoryOptions)
      const activityService = new ActivityService(mockIRepositoryOptions)

      const member1Created = await memberService.upsert({
        username: {
          [PlatformType.DISCORD]: 'test',
        },
        platform: PlatformType.DISCORD,
        joinedAt: '2020-05-27T15:13:30Z',
      })
      const member2Created = await memberService.upsert({
        username: {
          [PlatformType.DISCORD]: 'test2',
        },
        platform: PlatformType.DISCORD,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      // Simulate a reply chain in discord

      const activity1 = {
        type: 'message',
        timestamp: '2020-05-27T15:13:30Z',
        username: 'test',
        member: member1Created.id,
        platform: PlatformType.DISCORD,
        body: 'What is love?',
        isContribution: true,
        score: 1,
        sourceId: 'sourceId#1',
      }

      let activityCreated1 = await activityService.upsert(activity1)

      const activity2 = {
        type: 'message',
        timestamp: '2020-05-28T15:14:30Z',
        platform: PlatformType.DISCORD,
        body: 'Baby dont hurt me',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#2',
        sourceParentId: activityCreated1.sourceId,
      }

      const activityCreated2 = await activityService.upsert(activity2)

      const activity3 = {
        type: 'message',
        timestamp: '2020-05-28T15:15:30Z',
        platform: PlatformType.DISCORD,
        body: 'Dont hurt me',
        isContribution: true,
        username: 'test',
        member: member1Created.id,
        score: 2,
        sourceId: 'sourceId#3',
        sourceParentId: activityCreated2.sourceId,
      }

      const activityCreated3 = await activityService.upsert(activity3)

      const activity4 = {
        type: 'message',
        timestamp: '2020-05-28T15:16:30Z',
        platform: PlatformType.DISCORD,
        body: 'No more',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#4',
        sourceParentId: activityCreated3.sourceId,
      }

      const activityCreated4 = await activityService.upsert(activity4)

      // Get the conversation using slug (generated using the chain starter activity attributes.body)
      const conversationCreated = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          slug: 'what-is-love',
        })
      ).rows[0]

      // We have to get activity1 again because conversation creation happens
      // after creation of the first activity that has a parent (activity2)
      activityCreated1 = await activityService.findById(activityCreated1.id)

      // All activities (including chain starter) should belong to the same conversation
      expect(activityCreated1.conversationId).toStrictEqual(conversationCreated.id)
      expect(activityCreated2.conversationId).toStrictEqual(conversationCreated.id)
      expect(activityCreated3.conversationId).toStrictEqual(conversationCreated.id)
      expect(activityCreated4.conversationId).toStrictEqual(conversationCreated.id)

      // Emulate a thread in discord

      const activity5 = {
        type: 'message',
        timestamp: '2020-05-28T15:17:30Z',
        platform: PlatformType.DISCORD,
        body: 'Never gonna give you up',
        isContribution: true,
        username: 'test',
        member: member1Created.id,
        score: 2,
        sourceId: 'sourceId#5',
      }
      let activityCreated5 = await activityService.upsert(activity5)

      const activity6 = {
        type: 'message',
        timestamp: '2020-05-28T15:18:30Z',
        platform: PlatformType.DISCORD,
        body: 'Never gonna let you down',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#6',
        sourceParentId: activityCreated5.sourceId,
      }
      const activityCreated6 = await activityService.upsert(activity6)

      const activity7 = {
        type: 'message',
        timestamp: '2020-05-28T15:19:30Z',
        platform: PlatformType.DISCORD,
        body: 'Never gonna run around and desert you',
        isContribution: true,
        username: 'test',
        member: member1Created.id,
        score: 2,
        sourceId: 'sourceId#7',
        sourceParentId: activityCreated5.sourceId,
      }
      const activityCreated7 = await activityService.upsert(activity7)

      const conversationCreated2 = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          slug: 'never-gonna-give-you-up',
        })
      ).rows[0]

      activityCreated5 = await activityService.findById(activityCreated5.id)

      // All activities (including thread starter) should belong to the same conversation
      expect(activityCreated5.conversationId).toStrictEqual(conversationCreated2.id)
      expect(activityCreated6.conversationId).toStrictEqual(conversationCreated2.id)
      expect(activityCreated7.conversationId).toStrictEqual(conversationCreated2.id)
    })

    it('Should keep old timestamp', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberService = new MemberService(mockIRepositoryOptions)
      const activityService = new ActivityService(mockIRepositoryOptions)

      const cm = await memberService.upsert({
        username: {
          [PlatformType.DISCORD]: 'test',
        },
        platform: PlatformType.DISCORD,
      })

      const activity1 = {
        type: 'message',
        timestamp: '2020-05-27T15:13:30Z',
        username: 'test',
        member: cm.id,
        platform: PlatformType.DISCORD,
        sourceId: 'sourceId#1',
      }

      const activityCreated1 = await activityService.upsert(activity1)

      const activity2 = {
        type: 'message',
        timestamp: '2022-05-27T15:13:30Z',
        username: 'test',
        member: cm.id,
        platform: PlatformType.DISCORD,
        sourceId: 'sourceId#1',
        body: 'What is love?',
      }

      const activityCreated2 = await activityService.upsert(activity2)

      expect(activityCreated2.timestamp).toStrictEqual(activityCreated1.timestamp)
      expect(activityCreated2.body).toBe(activity2.body)
    })

    it('Should create various conversations successfully with given parent-child relationships of activities [descending timestamp order]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberService = new MemberService(mockIRepositoryOptions)
      const activityService = new ActivityService(mockIRepositoryOptions)

      const member1Created = await memberService.upsert({
        username: {
          [PlatformType.DISCORD]: 'test',
        },
        platform: PlatformType.DISCORD,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const member2Created = await memberService.upsert({
        username: {
          [PlatformType.DISCORD]: 'test2',
        },
        platform: PlatformType.DISCORD,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      // Simulate a reply chain in discord in reverse order (child activities come first)

      const activity4 = {
        type: 'message',
        timestamp: '2020-05-28T15:16:30Z',
        platform: PlatformType.DISCORD,
        body: 'No more',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#4',
        sourceParentId: 'sourceId#3',
      }

      let activityCreated4 = await activityService.upsert(activity4)

      const activity3 = {
        type: 'message',
        timestamp: '2020-05-28T15:15:30Z',
        platform: PlatformType.DISCORD,
        body: 'Dont hurt me',
        isContribution: true,
        username: 'test',
        member: member1Created.id,
        score: 2,
        sourceId: 'sourceId#3',
        sourceParentId: 'sourceId#2',
      }

      let activityCreated3 = await activityService.upsert(activity3)

      const activity2 = {
        type: 'message',
        timestamp: '2020-05-28T15:14:30Z',
        platform: PlatformType.DISCORD,
        body: 'Baby dont hurt me',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#2',
        sourceParentId: 'sourceId#1',
      }

      let activityCreated2 = await activityService.upsert(activity2)

      const activity1 = {
        type: 'message',
        timestamp: '2020-05-27T15:13:30Z',
        username: 'test',
        member: member1Created.id,
        platform: PlatformType.DISCORD,
        body: 'What is love?',
        isContribution: true,
        score: 1,
        sourceId: 'sourceId#1',
      }

      // main parent activity that starts the reply chain
      let activityCreated1 = await activityService.upsert(activity1)

      // get activities again
      activityCreated1 = await activityService.findById(activityCreated1.id)
      activityCreated2 = await activityService.findById(activityCreated2.id)
      activityCreated3 = await activityService.findById(activityCreated3.id)
      activityCreated4 = await activityService.findById(activityCreated4.id)

      // expect parentIds
      expect(activityCreated4.parentId).toBe(activityCreated3.id)
      expect(activityCreated3.parentId).toBe(activityCreated2.id)
      expect(activityCreated2.parentId).toBe(activityCreated1.id)

      // Get the conversation using slug (generated using the chain starter activity attributes.body -last added activityCreated1-)
      const conversationCreated = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          slug: 'what-is-love',
        })
      ).rows[0]

      // All activities (including chain starter) should belong to the same conversation
      expect(activityCreated1.conversationId).toStrictEqual(conversationCreated.id)
      expect(activityCreated2.conversationId).toStrictEqual(conversationCreated.id)
      expect(activityCreated3.conversationId).toStrictEqual(conversationCreated.id)
      expect(activityCreated4.conversationId).toStrictEqual(conversationCreated.id)

      // Simulate a thread in reverse order

      const activity6 = {
        type: 'message',
        timestamp: '2020-05-28T15:18:30Z',
        platform: PlatformType.DISCORD,
        body: 'Never gonna let you down',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#6',
        sourceParentId: 'sourceId#5',
      }
      let activityCreated6 = await activityService.upsert(activity6)

      const activity7 = {
        type: 'message',
        timestamp: '2020-05-28T15:19:30Z',
        platform: PlatformType.DISCORD,
        body: 'Never gonna run around and desert you',

        isContribution: true,
        username: 'test',
        member: member1Created.id,
        score: 2,
        sourceId: 'sourceId#7',
        sourceParentId: 'sourceId#5',
      }
      let activityCreated7 = await activityService.upsert(activity7)

      const activity5 = {
        type: 'message',
        timestamp: '2020-05-28T15:17:30Z',
        platform: PlatformType.DISCORD,
        body: 'Never gonna give you up',
        isContribution: true,
        username: 'test',
        member: member1Created.id,
        score: 2,
        sourceId: 'sourceId#5',
      }
      let activityCreated5 = await activityService.upsert(activity5)

      const conversationCreated2 = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          slug: 'never-gonna-give-you-up',
        })
      ).rows[0]

      // get activities again
      activityCreated5 = await activityService.findById(activityCreated5.id)
      activityCreated6 = await activityService.findById(activityCreated6.id)
      activityCreated7 = await activityService.findById(activityCreated7.id)

      // expect parentIds
      expect(activityCreated6.parentId).toBe(activityCreated5.id)
      expect(activityCreated7.parentId).toBe(activityCreated5.id)

      expect(activityCreated5.conversationId).toStrictEqual(conversationCreated2.id)
      expect(activityCreated6.conversationId).toStrictEqual(conversationCreated2.id)
      expect(activityCreated7.conversationId).toStrictEqual(conversationCreated2.id)

      // Add some more childs to the conversation1 and conversation2
      // After setting child-parent in reverse order, we're now adding
      // some more childiren in normal order

      // add a new reply to the chain-starter activity
      const activity8 = {
        type: 'message',
        timestamp: '2020-05-28T15:21:30Z',
        platform: PlatformType.DISCORD,
        body: 'additional reply to the reply chain',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#8',
        sourceParentId: 'sourceId#1',
      }

      const activityCreated8 = await activityService.upsert(activity8)

      expect(activityCreated8.parentId).toBe(activityCreated1.id)
      expect(activityCreated8.conversationId).toStrictEqual(conversationCreated.id)

      // add a new activity to the thread
      const activity9 = {
        type: 'message',
        timestamp: '2020-05-28T15:35:30Z',
        platform: PlatformType.DISCORD,
        body: 'additional message to the thread',
        isContribution: true,
        username: 'test2',
        member: member2Created.id,
        score: 2,
        sourceId: 'sourceId#9',
        sourceParentId: 'sourceId#5',
      }

      const activityCreated9 = await activityService.upsert(activity9)

      expect(activityCreated9.parentId).toBe(activityCreated5.id)
      expect(activityCreated9.conversationId).toStrictEqual(conversationCreated2.id)
    })

    // Tests for checking channel logic when creating activity
    // Settings should get updated only when a new channel is sent alog while creating activity.
    it('Should create an activity with a channel which is not present in settings and add it to settings', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test1',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Body',
        title: 'Title',
        url: 'URL',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        channel: 'TestChannel',
        attributes: {
          replies: 12,
        },
        sourceId: '#sourceId',
        isContribution: true,
        username: 'test1',
        member: memberCreated.id,
        score: 1,
      }

      await new ActivityService(mockIRepositoryOptions).upsert(activity)

      const activityChannels = SegmentRepository.getActivityChannels(mockIRepositoryOptions)

      expect(activityChannels[activity.platform].includes(activity.channel)).toBe(true)
    })

    it('Should not create a duplicate channel when a channel is present in settings', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test1',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })
      const activity = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Body',
        title: 'Title',
        url: 'URL',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        channel: 'TestChannel',
        attributes: {
          replies: 12,
        },
        sourceId: '#sourceId',
        isContribution: true,
        username: 'test1',
        member: memberCreated.id,
        score: 1,
      }

      await new ActivityService(mockIRepositoryOptions).upsert(activity)
      let settings = await SettingsRepository.findOrCreateDefault({}, mockIRepositoryOptions)
      const activity1 = {
        type: 'activity1',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Body',
        title: 'Title',
        url: 'URL',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          label: 'positive',
          sentiment: 0.98,
        },
        channel: 'TestChannel',
        attributes: {
          replies: 12,
        },
        sourceId: '#sourceId',
        isContribution: true,
        member: memberCreated.id,
        score: 1,
      }
      await new ActivityService(mockIRepositoryOptions).upsert(activity)
      const activityChannels = SegmentRepository.getActivityChannels(mockIRepositoryOptions)
      expect(activityChannels[activity1.platform].length).toBe(1)
    })
  })

  describe('createWithMember method', () => {
    it('Create an activity with given member [no parent activity]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(
        mockIRepositoryOptions,
      )

      await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
      await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
            [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
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
        organisation: 'Crowd',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
        title: 'Dashboard widgets and some other tweaks/adjustments',
        url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
        sentiment: {
          positive: 0.98,
          negative: 0.0,
          neutral: 0.02,
          mixed: 0.0,
          sentiment: 0.98,
          label: 'positive',
        },
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        isContribution: true,
        platform: PlatformType.GITHUB,
        score: 4,
        sourceId: '#sourceId1',
      }

      const activityWithMember = await new ActivityService(mockIRepositoryOptions).createWithMember(
        data,
      )

      delete activityWithMember.member
      delete activityWithMember.display
      delete activityWithMember.objectMember

      activityWithMember.createdAt = activityWithMember.createdAt.toISOString().split('T')[0]
      activityWithMember.updatedAt = activityWithMember.updatedAt.toISOString().split('T')[0]

      const memberFound = await MemberRepository.findById(
        activityWithMember.memberId,
        mockIRepositoryOptions,
      )

      const expectedActivityCreated = {
        id: activityWithMember.id,
        type: data.type,
        body: data.body,
        title: data.title,
        url: data.url,
        channel: data.channel,
        sentiment: data.sentiment,
        attributes: {},
        timestamp: new Date(data.timestamp),
        platform: data.platform,
        isContribution: data.isContribution,
        score: data.score,
        username: 'anil_github',
        objectMemberUsername: null,
        memberId: memberFound.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tasks: [],
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parentId: null,
        parent: null,
        sourceParentId: null,
        sourceId: data.sourceId,
        conversationId: null,
        organizationId: null,
        organization: null,
      }

      expect(activityWithMember).toStrictEqual(expectedActivityCreated)
    })

    it('Create an activity with given member [with parent activity, upsert member, new activity] [parent first, child later]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(
        mockIRepositoryOptions,
      )

      await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
      await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

      const member = {
        username: 'anil_github',
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
            [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
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
        organisation: 'Crowd',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
        title: 'Dashboard widgets and some other tweaks/adjustments',
        url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        isContribution: true,
        platform: PlatformType.GITHUB,
        score: 4,
        sourceId: '#sourceId1',
      }

      const activityWithMember1 = await new ActivityService(
        mockIRepositoryOptions,
      ).createWithMember(data)

      const data2 = {
        member,
        body: 'Description\nMinor pull request that fixes the order by Score and # of activities in the members list page',
        title: 'Add order by score and # of activities',
        url: 'https://github.com/CrowdDevHQ/crowd-web/pull/30',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        timestamp: '2021-11-30T14:20:27.000Z',
        type: 'pull_request-open',
        isContribution: true,
        platform: PlatformType.GITHUB,
        score: 4,
        sourceId: '#sourceId2',
        sourceParentId: data.sourceId,
      }

      const activityWithMember2 = await new ActivityService(
        mockIRepositoryOptions,
      ).createWithMember(data2)

      // Since an activity with a parent is created, a Conversation entity should be created at this point
      // with both parent and the child activities. Try finding it using the slug (slug is generated using parent.attributes.body)

      const conversationCreated = await new ConversationService(
        mockIRepositoryOptions,
      ).findAndCountAll({ slug: 'description-this-pull-request-adds-a-new-dashboard-and-related' })

      // delete models before expect because we already have ids (memberId, parentId)
      delete activityWithMember2.member
      delete activityWithMember2.parent
      delete activityWithMember2.display
      delete activityWithMember2.objectMember

      activityWithMember2.createdAt = activityWithMember2.createdAt.toISOString().split('T')[0]
      activityWithMember2.updatedAt = activityWithMember2.updatedAt.toISOString().split('T')[0]

      const memberFound = await MemberRepository.findById(
        activityWithMember1.memberId,
        mockIRepositoryOptions,
      )

      const expectedActivityCreated = {
        id: activityWithMember2.id,
        body: data2.body,
        title: data2.title,
        url: data2.url,
        channel: data2.channel,
        sentiment: {
          positive: 0.42,
          negative: 0.42,
          neutral: 0.42,
          mixed: 0.42,
          label: 'positive',
          sentiment: 0.42,
        },
        attributes: {},
        type: data2.type,
        timestamp: new Date(data2.timestamp),
        platform: data2.platform,
        tasks: [],
        isContribution: data2.isContribution,
        score: data2.score,
        username: 'anil_github',
        objectMemberUsername: null,
        memberId: memberFound.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parentId: activityWithMember1.id,
        sourceParentId: data2.sourceParentId,
        sourceId: data2.sourceId,
        conversationId: conversationCreated.rows[0].id,
        organizationId: null,
        organization: null,
      }

      expect(activityWithMember2).toStrictEqual(expectedActivityCreated)
    })

    it('Create an activity with given member [with parent activity, upsert member, new activity] [child first, parent later]', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const activityService = new ActivityService(mockIRepositoryOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(
        mockIRepositoryOptions,
      )

      await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
      await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

      const member = {
        username: 'anil_github',
        email: 'lala@l.com',
        score: 10,
        attributes: {
          [MemberAttributeName.IS_HIREABLE]: {
            [PlatformType.GITHUB]: true,
          },
          [MemberAttributeName.URL]: {
            [PlatformType.GITHUB]: 'https://github.com/imcvampire',
            [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
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
        organisation: 'Crowd',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const dataChild = {
        member,
        body: 'Description\nMinor pull request that fixes the order by Score and # of activities in the members list page',
        title: 'Add order by score and # of activities',
        url: 'https://github.com/CrowdDevHQ/crowd-web/pull/30',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        timestamp: '2021-11-30T14:20:27.000Z',
        type: 'pull_request-open',
        isContribution: true,
        platform: PlatformType.GITHUB,
        score: 4,
        sourceParentId: '#sourceId1',
        sourceId: '#childSourceId',
      }

      let activityWithMemberChild = await activityService.createWithMember(dataChild)

      const dataParent = {
        member,
        body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
        title: 'Dashboard widgets and some other tweaks/adjustments',
        url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        isContribution: true,
        platform: PlatformType.GITHUB,
        score: 4,
        sourceId: dataChild.sourceParentId,
      }

      let activityWithMemberParent = await activityService.createWithMember(dataParent)

      // after creating parent, conversation should be started
      const conversationCreated = await new ConversationService(
        mockIRepositoryOptions,
      ).findAndCountAll({ slug: 'description-this-pull-request-adds-a-new-dashboard-and-related' })

      // get child and parent activity again
      activityWithMemberChild = await activityService.findById(activityWithMemberChild.id)
      activityWithMemberParent = await activityService.findById(activityWithMemberParent.id)

      // delete models before expect because we already have ids (memberId, parentId)
      delete activityWithMemberChild.member
      delete activityWithMemberChild.parent
      delete activityWithMemberChild.display
      delete activityWithMemberChild.objectMember
      delete activityWithMemberParent.member
      delete activityWithMemberParent.parent
      delete activityWithMemberParent.display
      delete activityWithMemberParent.objectMember

      activityWithMemberChild.createdAt = activityWithMemberChild.createdAt
        .toISOString()
        .split('T')[0]
      activityWithMemberChild.updatedAt = activityWithMemberChild.updatedAt
        .toISOString()
        .split('T')[0]
      activityWithMemberParent.createdAt = activityWithMemberParent.createdAt
        .toISOString()
        .split('T')[0]
      activityWithMemberParent.updatedAt = activityWithMemberParent.updatedAt
        .toISOString()
        .split('T')[0]

      const memberFound = await MemberRepository.findById(
        activityWithMemberChild.memberId,
        mockIRepositoryOptions,
      )

      const expectedParentActivityCreated = {
        id: activityWithMemberParent.id,
        body: dataParent.body,
        title: dataParent.title,
        url: dataParent.url,
        channel: dataParent.channel,
        sentiment: {
          positive: 0.42,
          negative: 0.42,
          neutral: 0.42,
          mixed: 0.42,
          label: 'positive',
          sentiment: 0.42,
        },
        attributes: {},
        type: dataParent.type,
        timestamp: new Date(dataParent.timestamp),
        platform: dataParent.platform,
        isContribution: dataParent.isContribution,
        tasks: [],
        score: dataParent.score,
        username: 'anil_github',
        objectMemberUsername: null,
        memberId: memberFound.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parentId: null,
        sourceParentId: null,
        sourceId: dataParent.sourceId,
        conversationId: conversationCreated.rows[0].id,
        organizationId: null,
        organization: null,
      }

      expect(activityWithMemberParent).toStrictEqual(expectedParentActivityCreated)

      const expectedChildActivityCreated = {
        id: activityWithMemberChild.id,
        body: dataChild.body,
        title: dataChild.title,
        url: dataChild.url,
        channel: dataChild.channel,
        sentiment: {
          positive: 0.42,
          negative: 0.42,
          neutral: 0.42,
          mixed: 0.42,
          label: 'positive',
          sentiment: 0.42,
        },
        attributes: {},
        type: dataChild.type,
        timestamp: new Date(dataChild.timestamp),
        platform: dataChild.platform,
        isContribution: dataChild.isContribution,
        score: dataChild.score,
        username: 'anil_github',
        objectMemberUsername: null,
        memberId: memberFound.id,
        objectMemberId: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        tasks: [],
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        importHash: null,
        parentId: activityWithMemberParent.id,
        sourceParentId: dataChild.sourceParentId,
        sourceId: dataChild.sourceId,
        conversationId: conversationCreated.rows[0].id,
        organizationId: null,
        organization: null,
      }

      expect(activityWithMemberChild).toStrictEqual(expectedChildActivityCreated)
    })

    it('Create an activity with organization - member with single organization and no affiliation', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(
        mockIRepositoryOptions,
      )

      const org1 = {
        name: 'crowd.dev',
      }

      await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
      await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        organizations: [org1],
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      const activityWithMember = await new ActivityService(mockIRepositoryOptions).createWithMember(
        data,
      )

      // find activity
      const activity = await ActivityRepository.findById(
        activityWithMember.id,
        mockIRepositoryOptions,
      )

      expect(activity.organization.name).toEqual(org1.name)
    })

    it(`Create an activity with member's first organization - member with multiple organizations and no affiliation`, async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)

      const org1 = {
        name: 'tesla',
      }

      const org2 = {
        name: 'crowd.dev',
      }

      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        organizations: [org1, org2],
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      const activityWithMember = await new ActivityService(mockIRepositoryOptions).createWithMember(
        data,
      )

      // find activity
      const activity = await ActivityRepository.findById(
        activityWithMember.id,
        mockIRepositoryOptions,
      )

      expect(activity.organization.name).toEqual(org1.name)
    })

    it(`Shouldn't update existing activity's organization, when a different organization comes with the member`, async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await populateSegments(mockIRepositoryOptions)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(
        mockIRepositoryOptions,
      )

      const org1 = {
        name: 'tesla',
      }

      const org2 = {
        name: 'crowd.dev',
      }

      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        email: 'lala@l.com',
        organizations: [org1],
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const data = {
        member,
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      let activityWithMember = await new ActivityService(mockIRepositoryOptions).createWithMember(
        data,
      )

      let activity = await ActivityRepository.findById(
        activityWithMember.id,
        mockIRepositoryOptions,
      )

      expect(activity.organization.name).toEqual(org1.name)

      // create same activity with a different member organization
      data.member = {
        ...member,
        organizations: [org2],
      }

      await new ActivityService(mockIRepositoryOptions).createWithMember(data)

      activity = await ActivityRepository.findById(activityWithMember.id, mockIRepositoryOptions)

      // activity organization shouldn't change
      expect(activity.organization.name).toEqual(org1.name)
    })

    it(`Should respect the affiliation settings when setting an activity's organization with multiple member organizations`, async () => {
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

      await populateSegments(mockIRepositoryOptions)
      const org1 = await OrganizationRepository.create(
        {
          name: 'tesla',
        },
        mockIRepositoryOptions,
      )

      const org2 = await OrganizationRepository.create(
        {
          name: 'crowd.dev',
        },
        mockIRepositoryOptions,
      )

      const member = {
        username: {
          [PlatformType.GITHUB]: 'anil_github',
        },
        organizations: [org1, org2],
        affiliations: [
          {
            segmentId: segment1.id,
            organizationId: org2.id,
          },
          {
            segmentId: segment2.id,
            organizationId: null,
          },
        ],
      }

      const data = {
        member,
        timestamp: '2021-09-30T14:20:27.000Z',
        type: 'pull_request-closed',
        platform: PlatformType.GITHUB,
        sourceId: '#sourceId1',
      }

      switchSegments(mockIRepositoryOptions, [segment1])

      let activityWithMember = await new ActivityService(mockIRepositoryOptions).createWithMember(
        data,
      )

      let activity = await ActivityRepository.findById(
        activityWithMember.id,
        mockIRepositoryOptions,
      )

      // org2 should be set as organization because it's in member's affiliated organizations
      expect(activity.organization.name).toEqual(org2.name)

      // add another activity to segment2 for the same member
      switchSegments(mockIRepositoryOptions, [segment2])

      data.sourceId = '#sourceId2'
      data.member = member // createWithMember modifies member, reset it

      activityWithMember = await new ActivityService(mockIRepositoryOptions).createWithMember(data)

      activity = await ActivityRepository.findById(activityWithMember.id, mockIRepositoryOptions)

      // this member had a null affiliation(meaning no organizations should be set) in segment 2
      expect(activity.organization).toBeNull()
    })

    describe('Member tests in createWithMember', () => {
      it('Should set the joinedAt to the time of the activity when the member does not exist', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        await populateSegments(mockIRepositoryOptions)
        const memberAttributeSettingsService = new MemberAttributeSettingsService(
          mockIRepositoryOptions,
        )

        await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
        await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

        const member = {
          username: {
            [PlatformType.GITHUB]: 'anil_github',
          },
          email: 'lala@l.com',
          score: 10,
          attributes: {
            [MemberAttributeName.IS_HIREABLE]: {
              [PlatformType.GITHUB]: true,
            },
            [MemberAttributeName.URL]: {
              [PlatformType.GITHUB]: 'https://github.com/imcvampire',
              [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
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
          organisation: 'Crowd',
          joinedAt: '2020-05-27T15:13:30Z',
        }

        const data = {
          member,
          body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
          title: 'Dashboard widgets and some other tweaks/adjustments',
          url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
          channel: 'https://github.com/CrowdDevHQ/crowd-web',
          timestamp: '2021-09-30T14:20:27.000Z',
          type: 'pull_request-closed',
          isContribution: true,
          platform: PlatformType.GITHUB,
          score: 4,
          sourceId: '#sourceId1',
        }

        const activityWithMember = await new ActivityService(
          mockIRepositoryOptions,
        ).createWithMember(data)

        delete activityWithMember.member
        delete activityWithMember.display
        delete activityWithMember.objectMember

        activityWithMember.createdAt = activityWithMember.createdAt.toISOString().split('T')[0]
        activityWithMember.updatedAt = activityWithMember.updatedAt.toISOString().split('T')[0]

        const memberFound = await MemberRepository.findById(
          activityWithMember.memberId,
          mockIRepositoryOptions,
        )

        const expectedActivityCreated = {
          id: activityWithMember.id,
          body: data.body,
          title: data.title,
          url: data.url,
          channel: data.channel,
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            mixed: 0.42,
            label: 'positive',
            sentiment: 0.42,
          },
          attributes: {},
          type: data.type,
          timestamp: new Date(data.timestamp),
          platform: data.platform,
          isContribution: data.isContribution,
          score: data.score,
          username: 'anil_github',
          objectMemberUsername: null,
          memberId: memberFound.id,
          objectMemberId: null,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          tasks: [],
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          deletedAt: null,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          importHash: null,
          parentId: null,
          parent: null,
          sourceParentId: null,
          sourceId: data.sourceId,
          conversationId: null,
          organizationId: null,
          organization: null,
        }

        expect(activityWithMember).toStrictEqual(expectedActivityCreated)
        expect(memberFound.joinedAt).toStrictEqual(expectedActivityCreated.timestamp)
        expect(memberFound.username).toStrictEqual({
          [PlatformType.GITHUB]: ['anil_github'],
        })
      })

      it('Should replace joinedAt when activity ts is earlier than existing joinedAt', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        await populateSegments(mockIRepositoryOptions)
        const memberAttributeSettingsService = new MemberAttributeSettingsService(
          mockIRepositoryOptions,
        )

        await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
        await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

        const member = {
          username: {
            [PlatformType.GITHUB]: 'anil_github',
          },
          displayName: 'Anil',
          email: 'lala@l.com',
          score: 10,
          attributes: {
            [MemberAttributeName.IS_HIREABLE]: {
              [PlatformType.GITHUB]: true,
            },
            [MemberAttributeName.URL]: {
              [PlatformType.GITHUB]: 'https://github.com/imcvampire',
              [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
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
          organisation: 'Crowd',
          joinedAt: '2022-05-27T15:13:30Z',
        }

        await MemberRepository.create(member, mockIRepositoryOptions)

        const data = {
          member,
          body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
          title: 'Dashboard widgets and some other tweaks/adjustments',
          url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
          channel: 'https://github.com/CrowdDevHQ/crowd-web',
          timestamp: '2021-09-30T14:20:27.000Z',
          type: 'pull_request-closed',
          isContribution: true,
          platform: PlatformType.GITHUB,
          score: 4,
          sourceId: '#sourceId1',
        }

        const activityWithMember = await new ActivityService(
          mockIRepositoryOptions,
        ).createWithMember(data)

        delete activityWithMember.member
        delete activityWithMember.display
        delete activityWithMember.objectMember

        activityWithMember.createdAt = activityWithMember.createdAt.toISOString().split('T')[0]
        activityWithMember.updatedAt = activityWithMember.updatedAt.toISOString().split('T')[0]

        const memberFound = await MemberRepository.findById(
          activityWithMember.memberId,
          mockIRepositoryOptions,
        )

        const expectedActivityCreated = {
          id: activityWithMember.id,
          body: data.body,
          title: data.title,
          url: data.url,
          channel: data.channel,
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            sentiment: 0.42,
            mixed: 0.42,
            label: 'positive',
          },
          attributes: {},
          type: data.type,
          timestamp: new Date(data.timestamp),
          platform: data.platform,
          isContribution: data.isContribution,
          score: data.score,
          username: 'anil_github',
          objectMemberUsername: null,
          memberId: memberFound.id,
          objectMemberId: null,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          deletedAt: null,
          tasks: [],
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          importHash: null,
          parentId: null,
          parent: null,
          sourceId: data.sourceId,
          sourceParentId: null,
          conversationId: null,
          organizationId: null,
          organization: null,
        }

        expect(activityWithMember).toStrictEqual(expectedActivityCreated)
        expect(memberFound.joinedAt).toStrictEqual(expectedActivityCreated.timestamp)
        expect(memberFound.username).toStrictEqual({
          [PlatformType.GITHUB]: ['anil_github'],
        })
      })

      it('Should not replace joinedAt when activity ts is later than existing joinedAt', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        await populateSegments(mockIRepositoryOptions)
        const memberAttributeSettingsService = new MemberAttributeSettingsService(
          mockIRepositoryOptions,
        )

        await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
        await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

        const member = {
          username: {
            [PlatformType.GITHUB]: 'anil_github',
          },
          displayName: 'Anil',
          email: 'lala@l.com',
          score: 10,
          attributes: {
            [MemberAttributeName.IS_HIREABLE]: {
              [PlatformType.GITHUB]: true,
            },
            [MemberAttributeName.URL]: {
              [PlatformType.GITHUB]: 'https://github.com/imcvampire',
              [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
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
          organisation: 'Crowd',
          joinedAt: '2020-05-27T15:13:30Z',
        }

        await MemberRepository.create(member, mockIRepositoryOptions)

        const data = {
          member,
          body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
          title: 'Dashboard widgets and some other tweaks/adjustments',
          url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
          channel: 'https://github.com/CrowdDevHQ/crowd-web',
          timestamp: '2021-09-30T14:20:27.000Z',
          type: 'pull_request-closed',
          isContribution: true,
          platform: PlatformType.GITHUB,
          score: 4,
          sourceId: '#sourceId1',
        }

        const activityWithMember = await new ActivityService(
          mockIRepositoryOptions,
        ).createWithMember(data)

        delete activityWithMember.member
        delete activityWithMember.display
        delete activityWithMember.objectMember

        activityWithMember.createdAt = activityWithMember.createdAt.toISOString().split('T')[0]
        activityWithMember.updatedAt = activityWithMember.updatedAt.toISOString().split('T')[0]

        const memberFound = await MemberRepository.findById(
          activityWithMember.memberId,
          mockIRepositoryOptions,
        )

        const expectedActivityCreated = {
          id: activityWithMember.id,
          body: data.body,
          title: data.title,
          url: data.url,
          channel: data.channel,
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            mixed: 0.42,
            label: 'positive',
            sentiment: 0.42,
          },
          attributes: {},
          type: data.type,
          timestamp: new Date(data.timestamp),
          platform: data.platform,
          isContribution: data.isContribution,
          score: data.score,
          username: 'anil_github',
          objectMemberUsername: null,
          memberId: memberFound.id,
          objectMemberId: null,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          tasks: [],
          deletedAt: null,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          importHash: null,
          parentId: null,
          parent: null,
          sourceId: data.sourceId,
          sourceParentId: null,
          conversationId: null,
          organizationId: null,
          organization: null,
        }

        expect(activityWithMember).toStrictEqual(expectedActivityCreated)
        expect(memberFound.joinedAt).toStrictEqual(new Date('2020-05-27T15:13:30Z'))
        expect(memberFound.username).toStrictEqual({
          [PlatformType.GITHUB]: ['anil_github'],
        })
      })

      it('It should replace joinedAt if the original was in year 1970', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        await populateSegments(mockIRepositoryOptions)
        await populateSegments(mockIRepositoryOptions)
        const memberAttributeSettingsService = new MemberAttributeSettingsService(
          mockIRepositoryOptions,
        )

        await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
        await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

        const member = {
          username: {
            [PlatformType.GITHUB]: 'anil_github',
          },
          displayName: 'Anil',
          email: 'lala@l.com',
          score: 10,
          attributes: {
            [MemberAttributeName.IS_HIREABLE]: {
              [PlatformType.GITHUB]: true,
            },
            [MemberAttributeName.URL]: {
              [PlatformType.GITHUB]: 'https://github.com/imcvampire',
              [PlatformType.TWITTER]: 'https://twitter.com/imcvampire',
            },
            [MemberAttributeName.WEBSITE_URL]: {
              [PlatformType.GITHUB]: 'https://imcvampire.js.org/',
            },
            [MemberAttributeName.BIO]: {
              [PlatformType.GITHUB]: 'Computer Science',
            },
            [MemberAttributeName.LOCATION]: {
              [PlatformType.GITHUB]: 'Istanbul',
            },
          },
          organisation: 'Crowd',
          joinedAt: new Date('1970-01-01T00:00:00Z'),
        }

        await MemberRepository.create(member, mockIRepositoryOptions)

        const data = {
          member,
          body: 'Description\nThis pull request adds a new Dashboard and related widgets. This work will probably have to be revisited as soon as possible since a lot of decisions were made, without having too much time to think about different outcomes/possibilities. We rushed these changes so that we can demo a working dashboard to YC and to our Investors.\nChanges Proposed\n\nUpdate Chart.js\nAdd two different type of widgets (number and graph)\nRemove older/default widgets from dashboard and add our own widgets\nHide some items from the menu\nAdd all widget infrastructure (actions, services, etc) to integrate with the backend\nAdd a few more CSS tweaks\n\nScreenshots',
          title: 'Dashboard widgets and some other tweaks/adjustments',
          state: 'merged',
          url: 'https://github.com/CrowdDevHQ/crowd-web/pull/16',
          channel: 'https://github.com/CrowdDevHQ/crowd-web',
          timestamp: '2021-09-30T14:20:27.000Z',
          type: 'pull_request-closed',
          isContribution: true,
          platform: PlatformType.GITHUB,
          score: 4,
          sourceId: '#sourceId1',
        }

        const activityWithMember = await new ActivityService(
          mockIRepositoryOptions,
        ).createWithMember(data)

        delete activityWithMember.member
        delete activityWithMember.display
        delete activityWithMember.objectMember

        activityWithMember.createdAt = activityWithMember.createdAt.toISOString().split('T')[0]
        activityWithMember.updatedAt = activityWithMember.updatedAt.toISOString().split('T')[0]

        const memberFound = await MemberRepository.findById(
          activityWithMember.memberId,
          mockIRepositoryOptions,
        )

        const expectedActivityCreated = {
          id: activityWithMember.id,
          body: data.body,
          title: data.title,
          url: data.url,
          channel: data.channel,
          sentiment: {
            positive: 0.42,
            negative: 0.42,
            neutral: 0.42,
            mixed: 0.42,
            label: 'positive',
            sentiment: 0.42,
          },
          attributes: {},
          type: data.type,
          timestamp: new Date(data.timestamp),
          platform: data.platform,
          isContribution: data.isContribution,
          score: data.score,
          username: 'anil_github',
          objectMemberUsername: null,
          memberId: memberFound.id,
          objectMemberId: null,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          deletedAt: null,
          tasks: [],
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments[0].id,
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          importHash: null,
          parentId: null,
          parent: null,
          sourceId: data.sourceId,
          sourceParentId: null,
          conversationId: null,
          organizationId: null,
          organization: null,
        }

        expect(activityWithMember).toStrictEqual(expectedActivityCreated)
        expect(memberFound.joinedAt).toStrictEqual(expectedActivityCreated.timestamp)
        expect(memberFound.username).toStrictEqual({
          [PlatformType.GITHUB]: ['anil_github'],
        })
      })

      it('Should respect joinedAt when an existing activity comes in with a different timestamp', async () => {
        // This can happen in cases like the Twitter integration.
        // For follow activities, if we are onboarding we set the timestamp to 1970,
        // but if we are not onboarding, we set the timestamp to the current time.
        // This can cause having 2 activities with different timestamps, but the same sourceId.
        // The joinedAt should stay untouched in this case.
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        await populateSegments(mockIRepositoryOptions)
        const memberAttributeSettingsService = new MemberAttributeSettingsService(
          mockIRepositoryOptions,
        )

        await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
        await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)

        const data = {
          member: {
            username: 'anil',
          },
          timestamp: '1970-01-01T00:00:00.000Z',
          type: 'follow',
          platform: PlatformType.TWITTER,
          sourceId: '#sourceId1',
        }

        const activityWithMember = await new ActivityService(
          mockIRepositoryOptions,
        ).createWithMember(data)

        const data2 = {
          member: {
            username: 'anil',
          },
          timestamp: '2021-09-30T14:20:27.000Z',
          type: 'follow',
          platform: PlatformType.TWITTER,
          sourceId: '#sourceId1',
        }
        // Upsert the same activity with a different timestamp
        await new ActivityService(mockIRepositoryOptions).createWithMember(data2)

        const memberFound = await MemberRepository.findById(
          activityWithMember.memberId,
          mockIRepositoryOptions,
        )
        // The joinedAt should stay untouched
        expect(memberFound.joinedAt).toStrictEqual(new Date('1970-01-01T00:00:00.000Z'))
      })
    })
  })

  describe('addToConversation method', () => {
    it('Should create a new conversation and add the activities in, when parent and child has no conversation', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const activityService = new ActivityService(mockIRepositoryOptions)

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        sourceId: '#sourceId2',
      }

      let activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      const conversationCreated = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          slug: 'some-parent-activity',
        })
      ).rows[0]

      // get activities again
      activityChildCreated = await activityService.findById(activityChildCreated.id)
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // activities should belong to the newly created conversation
      expect(activityChildCreated.conversationId).toBe(conversationCreated.id)
      expect(activityParentCreated.conversationId).toBe(conversationCreated.id)
    })

    it('Should add the child activity to parents conversation, when parent already has a conversation', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const activityService = new ActivityService(mockIRepositoryOptions)
      const conversationService = new ConversationService(mockIRepositoryOptions)

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const conversation = await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        conversationId: conversation.id,
        sourceId: '#sourceId1',
      }

      const activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        sourceId: '#sourceId2',
      }

      let activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      // get child activity again
      activityChildCreated = await activityService.findById(activityChildCreated.id)

      // child should be added to already existing conservation
      expect(activityChildCreated.conversationId).toBe(conversation.id)
      expect(activityParentCreated.conversationId).toBe(conversation.id)
    })

    it('Should add the parent activity to childs conversation and update conversation [published=false] title&slug, when child already has a conversation', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const activityService = new ActivityService(mockIRepositoryOptions)
      const conversationService = new ConversationService(mockIRepositoryOptions)

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      let conversation = await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        body: 'Some Parent Activity',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        conversationId: conversation.id,
        sourceId: '#sourceId2',
      }

      const activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      // get the conversation again
      conversation = await conversationService.findById(conversation.id)

      // conversation should be updated with newly added parents body
      expect(conversation.title).toBe('Some Parent Activity')
      expect(conversation.slug).toBe('some-parent-activity')

      // get parent activity again
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // parent should be added to the conversation
      expect(activityChildCreated.conversationId).toBe(conversation.id)
      expect(activityParentCreated.conversationId).toBe(conversation.id)
    })

    it('Should add the parent activity to childs conversation and NOT update conversation [published=true] title&slug, when child already has a conversation', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const activityService = new ActivityService(mockIRepositoryOptions)
      const conversationService = new ConversationService(mockIRepositoryOptions)

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      let conversation = await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
        published: true,
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Some Parent Activity',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Here',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        conversationId: conversation.id,
        sourceId: '#sourceId2',
      }

      const activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      await SequelizeRepository.commitTransaction(transaction)

      // get the conversation again
      conversation = await conversationService.findById(conversation.id)

      // conversation fields should NOT be updated because it's already published
      expect(conversation.title).toBe('some title')
      expect(conversation.slug).toBe('some-slug')

      // get parent activity again
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // parent should be added to the conversation
      expect(activityChildCreated.conversationId).toBe(conversation.id)
      expect(activityParentCreated.conversationId).toBe(conversation.id)
    })

    it('Should always auto-publish when conversationSettings.autoPublish.status is set to all', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const activityService = new ActivityService(mockIRepositoryOptions)
      await SettingsRepository.findOrCreateDefault(
        { website: 'https://some-website' },
        mockIRepositoryOptions,
      )
      await ConversationSettingsRepository.findOrCreateDefault(
        {
          autoPublish: {
            status: 'all',
          },
        },
        mockIRepositoryOptions,
      )

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Some Parent Activity',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Here',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        sourceId: '#sourceId2',
      }

      let activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      const conversationCreated = (
        await new ConversationService({
          ...mockIRepositoryOptions,
          transaction,
        } as IServiceOptions).findAndCountAll({
          slug: 'some-parent-activity',
        })
      ).rows[0]

      await SequelizeRepository.commitTransaction(transaction)

      // get activities again
      activityChildCreated = await activityService.findById(activityChildCreated.id)
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // activities should belong to the newly created conversation
      expect(activityChildCreated.conversationId).toBe(conversationCreated.id)
      expect(activityParentCreated.conversationId).toBe(conversationCreated.id)

      expect(conversationCreated.published).toStrictEqual(true)
    })

    it('Should never auto-publish when conversationSettings.autoPublish.status is set to disabled', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const activityService = new ActivityService(mockIRepositoryOptions)
      await SettingsRepository.findOrCreateDefault(
        { website: 'https://some-website' },
        mockIRepositoryOptions,
      )
      await ConversationSettingsRepository.findOrCreateDefault(
        {
          autoPublish: {
            status: 'disabled',
          },
        },
        mockIRepositoryOptions,
      )

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Some Parent Activity',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Here',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        sourceId: '#sourceId2',
      }

      let activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      const conversationCreated = (
        await new ConversationService({
          ...mockIRepositoryOptions,
          transaction,
        } as IServiceOptions).findAndCountAll({
          slug: 'some-parent-activity',
        })
      ).rows[0]

      await SequelizeRepository.commitTransaction(transaction)

      // get activities again
      activityChildCreated = await activityService.findById(activityChildCreated.id)
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // activities should belong to the newly created conversation
      expect(activityChildCreated.conversationId).toBe(conversationCreated.id)
      expect(activityParentCreated.conversationId).toBe(conversationCreated.id)

      expect(conversationCreated.published).toStrictEqual(false)
    })

    it('Should auto-publish when conversationSettings.autoPublish.status is set to custom and rules match', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const activityService = new ActivityService(mockIRepositoryOptions)
      await SettingsRepository.findOrCreateDefault(
        { website: 'https://some-website' },
        mockIRepositoryOptions,
      )
      await ConversationSettingsRepository.findOrCreateDefault(
        {
          autoPublish: {
            status: 'custom',
            channelsByPlatform: {
              [PlatformType.GITHUB]: ['crowd-web'],
            },
          },
        },
        mockIRepositoryOptions,
      )

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Some Parent Activity',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Here',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        sourceId: '#sourceId2',
      }

      let activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      const conversationCreated = (
        await new ConversationService({
          ...mockIRepositoryOptions,
          transaction,
        } as IServiceOptions).findAndCountAll({
          slug: 'some-parent-activity',
        })
      ).rows[0]

      await SequelizeRepository.commitTransaction(transaction)

      // get activities again
      activityChildCreated = await activityService.findById(activityChildCreated.id)
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // activities should belong to the newly created conversation
      expect(activityChildCreated.conversationId).toBe(conversationCreated.id)
      expect(activityParentCreated.conversationId).toBe(conversationCreated.id)

      expect(conversationCreated.published).toStrictEqual(true)
    })

    it("Should not auto-publish when conversationSettings.autoPublish.status is set to custom and rules don't match", async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const activityService = new ActivityService(mockIRepositoryOptions)
      await SettingsRepository.findOrCreateDefault(
        { website: 'https://some-website' },
        mockIRepositoryOptions,
      )
      await ConversationSettingsRepository.findOrCreateDefault(
        {
          autoPublish: {
            status: 'custom',
            channelsByPlatform: {
              [PlatformType.GITHUB]: ['a-different-test-channel'],
            },
          },
        },
        mockIRepositoryOptions,
      )

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: 'test',
        },
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Some Parent Activity',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#sourceId1',
      }

      let activityParentCreated = await ActivityRepository.create(
        activityParent,
        mockIRepositoryOptions,
      )

      const activityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: PlatformType.GITHUB,
        body: 'Here',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: activityParentCreated.id,
        sourceId: '#sourceId2',
      }

      let activityChildCreated = await ActivityRepository.create(
        activityChild,
        mockIRepositoryOptions,
      )

      const transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        activityChildCreated.id,
        activityParentCreated.id,
        transaction,
      )

      const conversations = await new ConversationService({
        ...mockIRepositoryOptions,
        transaction,
      } as IServiceOptions).findAndCountAll({
        slug: 'some-parent-activity',
      })

      const conversationCreated = conversations.rows[0]

      await SequelizeRepository.commitTransaction(transaction)

      // get activities again
      activityChildCreated = await activityService.findById(activityChildCreated.id)
      activityParentCreated = await activityService.findById(activityParentCreated.id)

      // activities should belong to the newly created conversation
      expect(activityChildCreated.conversationId).toBe(conversationCreated.id)
      expect(activityParentCreated.conversationId).toBe(conversationCreated.id)

      expect(conversationCreated.published).toStrictEqual(false)
    })
  })
})
