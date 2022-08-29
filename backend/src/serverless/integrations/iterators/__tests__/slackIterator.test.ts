import { SuperfaceClient } from '@superfaceai/one-sdk'
import moment from 'moment'
import { Channels } from '../../types/regularTypes'
import SlackIterator from '../slackIterator'
import SequelizeTestUtils from '../../../../database/utils/sequelizeTestUtils'
import IntegrationService from '../../../../services/integrationService'
import BaseIterator from '../baseIterator'
import { SlackGrid } from '../../grid/slackGrid'
import { PlatformType } from '../../../../utils/platforms'

const db = null

async function getSlackIterator(members = {}, channels = [{ name: 'dev', id: 'C01NBV2BDDK' }]) {
  const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
  const tenantId = mockIRepositoryOptions.currentTenant.id
  const integrationService = new IntegrationService(mockIRepositoryOptions)
  const integrationId = (
    await integrationService.createOrUpdate({
      platform: PlatformType.SLACK,
      token: 'token',
      settings: {},
    })
  ).id
  const superfaceMock = {} as SuperfaceClient
  return new SlackIterator(
    superfaceMock,
    tenantId,
    'token',
    channels,
    members,
    integrationId,
    mockIRepositoryOptions,
    { endpoint: '', page: '' },
    false,
  )
}

describe('Slack iterator tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('Init tests', () => {
    it('It should initialise endpoints properly', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
      ]
      const members = {}
      const iter = await getSlackIterator(members, channels)
      expect(iter.endpoints).toEqual(['members', '1', '2'])
    })

    it('It should initialise endpoints without channels', async () => {
      const channels: Channels = []
      const members = {}
      const iter = await getSlackIterator(members, channels)
      expect(iter.endpoints).toEqual(['members'])
    })

    it('It should initialise endpoints with members', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
      ]
      const members = { u1: 'gilfoyle', u2: 'dinesh' }
      const iter = await getSlackIterator(members, channels)
      expect(iter.endpoints).toEqual(['members', '1', '2'])
      expect(iter.members).toStrictEqual(members)
    })
  })

  describe('Channel name tests', () => {
    it('It get the channel names', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1' },
      ]
      const iter = await getSlackIterator({}, channels)
      expect(iter.channelsInfo).toEqual({
        '1': { name: 'channel1', new: false },
        '2': { name: 'channel2', new: false },
        '3': { name: 'thread1', new: false },
      })
    })

    it('It get the channel names with new channels', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', new: true },
      ]
      const iter = await getSlackIterator({}, channels)
      expect(iter.channelsInfo).toEqual({
        '1': { name: 'channel1', new: false },
        '2': { name: 'channel2', new: false },
        '3': { name: 'thread1', new: true },
      })
    })
  })

  describe('Replace mention for users tests', () => {
    it('It should replace a single mention that exists in members from a message', async () => {
      const members = { user1: 'gilfoyle' }
      const text = 'Hey <@user1>'
      const iter = await getSlackIterator(members)

      expect(iter.removeMentions(text)).toEqual('Hey @gilfoyle')
    })

    it('It should replace a single mention that does not exist in members from a message', async () => {
      const members = { user2: 'gilfoyle' }
      const text = 'Hey <@user1>'
      const iter = await getSlackIterator(members)

      expect(iter.removeMentions(text)).toEqual('Hey @mention')
    })

    it('It should replace multiple mentions that exist in members from a message', async () => {
      const members = { user1: 'gilfoyle', user2: 'dinesh' }
      const text = 'Hey <@user1> and <@user2>'
      const iter = await getSlackIterator(members)

      expect(iter.removeMentions(text)).toEqual('Hey @gilfoyle and @dinesh')
    })

    it('It should replace multiple mentions that exist and do not exist in members from a message', async () => {
      const members = { user1: 'gilfoyle', user2: 'dinesh' }
      const text = 'Hey <@user1> and <@user2> and <@user3>'
      const iter = await getSlackIterator(members)

      expect(iter.removeMentions(text)).toEqual('Hey @gilfoyle and @dinesh and @mention')
    })

    it('It should work when mentions are together', async () => {
      const members = { user1: 'gilfoyle', user2: 'dinesh' }
      const text = 'Hey <@user1><@user2>'
      const iter = await getSlackIterator(members)

      expect(iter.removeMentions(text)).toEqual('Hey @gilfoyle@dinesh')
    })
  })

  describe('Parse messages tests', () => {
    const members = {
      a12345: 'username',
      user1: 'gilfoyle',
      user2: 'dinesh',
    }
    it('It should parse a message from a normal channel', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const messages = [
        {
          id: '12345',
          text: 'body here',
          reactions: ['1', '2', '3'],
          createdAt: 1644599456476.499,
          author: {
            id: 'a12345',
          },
        },
      ]
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '',
          timestamp: moment(1644599456476.499).toDate(),
          crowdInfo: {
            body: 'body here',
            url: '',
            channel: 'channel1',
            thread: false,
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })

    it('It should parse a bare-bones message', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const messages = [
        {
          id: '12345',
          createdAt: 1644599456476.499,
          author: {
            id: 'a12345',
          },
        },
      ]
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: '12345',
          timestamp: moment(1644599456476.499).toDate(),
          sourceParentId: '',
          crowdInfo: {
            body: '',
            url: '',
            channel: 'channel1',
            thread: false,
            reactions: [],
            attachments: [],
          },
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })

    it('It should parse a message with mentions', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const messages = [
        {
          id: '12345',
          text: 'body here <@user1> and <@user2> <@user3>',
          reactions: ['1', '2', '3'],
          createdAt: 1644599456476.499,
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '',
          timestamp: moment(1644599456476.499).toDate(),
          crowdInfo: {
            body: 'body here @gilfoyle and @dinesh @mention',
            url: '',
            channel: 'channel1',
            thread: false,
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })

    it('It should ignore a message with member not in members', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator({}, channels)
      const messages = [
        {
          id: '12345',
          createdAt: 1644599456476.499,
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = []
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })
  })

  describe('Parse messages in threads', () => {
    const members = {
      a12345: 'username',
      user1: 'gilfoyle',
      user2: 'dinesh',
    }
    it('It should parse a message from a thread', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const threadEncoded = iter.encodeThreadEndpoint('threadId', '1', 'Placeholder')
      const thread = BaseIterator.decodeEndpoint(threadEncoded)

      const messages = [
        {
          id: '12345',
          text: 'body here',
          reactions: ['1', '2', '3'],
          createdAt: '1645792885.131999',
          author: {
            id: 'a12345',
          },
        },
      ]
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: '12345',
          sourceParentId: 'threadId',
          timestamp: moment(Date.parse('2022-02-25T12:41:25.131Z')).toDate(),
          crowdInfo: {
            body: 'body here',
            url: '',
            channel: thread.channel,
            thread: {
              id: thread.threadId,
              body: thread.placeholder,
            },
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessagesInThreads(messages, threadEncoded)
      expect(received).toStrictEqual(expected)
    })

    it('It should parse a bare-bones message in a thread', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const threadEncoded = iter.encodeThreadEndpoint('threadId', '1', 'Placeholder')
      const thread = BaseIterator.decodeEndpoint(threadEncoded)

      const messages = [
        {
          id: '12345',
          createdAt: '1645792885.131999',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: '12345',
          sourceParentId: 'threadId',
          timestamp: moment(Date.parse('2022-02-25T12:41:25.131Z')).toDate(),
          crowdInfo: {
            body: '',
            url: '',
            channel: thread.channel,
            thread: {
              body: thread.placeholder,
              id: thread.threadId,
            },
            reactions: [],
            attachments: [],
          },
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessagesInThreads(messages, threadEncoded)
      expect(received).toStrictEqual(expected)
    })

    it('It should parse a message with mentions', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const threadEncoded = iter.encodeThreadEndpoint('threadId', '1', 'Placeholder')
      const thread = BaseIterator.decodeEndpoint(threadEncoded)

      const messages = [
        {
          id: '12345',
          text: 'body here <@user1> and <@user2> <@user3>',
          reactions: ['1', '2', '3'],
          createdAt: '1645792885.131999',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'message',
          sourceId: '12345',
          sourceParentId: 'threadId',
          timestamp: moment(Date.parse('2022-02-25T12:41:25.131Z')).toDate(),
          crowdInfo: {
            body: 'body here @gilfoyle and @dinesh @mention',
            url: '',
            channel: thread.channel,
            thread: {
              body: thread.placeholder,
              id: thread.threadId,
            },
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.message.score,
          isKeyAction: SlackGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessagesInThreads(messages, threadEncoded)
      expect(received).toStrictEqual(expected)
    })

    it('It should ignore a message with member not in members', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator({}, channels)
      const messages = [
        {
          id: '12345',
          createdAt: '1645792885.131999',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = []
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })
  })

  describe('Parse members tests', () => {
    const members = {}
    it('It should parse a normal member without onboarding', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const messages = [
        {
          id: 'a12345',
          username: 'username',
        },
      ]
      const received = await iter.parseMembers(messages)
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'channel_joined',
          sourceId: 'a12345',
          timestamp: received[0].timestamp,
          crowdInfo: {},
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: SlackGrid.join.score,
          isKeyAction: SlackGrid.join.isKeyAction,
        },
      ]
      expect(received).toStrictEqual(expected)
      expect(moment(received[0].timestamp).unix()).toBeGreaterThanOrEqual(
        moment().subtract(1, 'seconds').unix(),
      )
    })

    it('It should parse a normal member with onboarding', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      iter.onboarding = true
      const messages = [
        {
          id: 'a123456',
          username: 'username',
        },
      ]
      const received = await iter.parseMembers(messages)
      const expected = [
        {
          tenant: iter.tenant,
          platform: PlatformType.SLACK,
          type: 'channel_joined',
          sourceId: 'a123456',
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          crowdInfo: {},
          member: {
            username: 'username',
            crowdInfo: {
              id: 'a123456',
            },
          },
          score: SlackGrid.join.score,
          isKeyAction: SlackGrid.join.isKeyAction,
        },
      ]
      expect(received).toStrictEqual(expected)
    })

    it('It not return anything for a bot member', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const messages = [
        {
          joinedAt: '2020-01-01T00:00:00.000Z',
          id: 'a12345',
          username: 'username',
          isBot: true,
        },
      ]
      const expected = []
      const received = await iter.parseMembers(messages)
      expect(received).toStrictEqual(expected)
    })

    it('It not return anything for slackBot', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator(members, channels)
      const messages = [
        {
          joinedAt: '2020-01-01T00:00:00.000Z',
          id: 'a12345',
          username: 'Slackbot',
          isBot: false,
        },
      ]
      const expected = []
      const received = await iter.parseMembers(messages)
      expect(received).toStrictEqual(expected)
    })

    it('Members should not be parsed if they already exist', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator({ m1: 'username1' }, channels)
      const messages = [
        {
          joinedAt: '2020-01-01T00:00:00.000Z',
          id: 'm1',
          username: 'username1',
        },
      ]
      const received = await iter.parseMembers(messages)
      const expected = []

      expect(received).toStrictEqual(expected)
    })

    describe('Members instance variable update', () => {
      it('It should update the members instance variable for a new member', async () => {
        const channels: Channels = [
          { id: '1', name: 'channel1' },
          { id: '2', name: 'channel2' },
          { id: '3', name: 'thread1', thread: true },
        ]
        const iter = await getSlackIterator({}, channels)
        const messages = [
          {
            joinedAt: '2020-01-01T00:00:00.000Z',
            id: 'id123',
            username: 'new',
          },
        ]

        await iter.parseMembers(messages)
        const expected = { id123: 'new' }

        expect(iter.members).toStrictEqual(expected)
      })

      it('The members instance variable should stay equal for a member that already exists', async () => {
        const channels: Channels = [
          { id: '1', name: 'channel1' },
          { id: '2', name: 'channel2' },
          { id: '3', name: 'thread1', thread: true },
        ]
        const iter = await getSlackIterator({ id123: 'new' }, channels)
        const messages = [
          {
            joinedAt: '2020-01-01T00:00:00.000Z',
            id: 'id123',
            username: 'new',
          },
        ]
        await iter.parseMembers(messages)
        const expected = { id123: 'new' }

        expect(iter.members).toStrictEqual(expected)
      })

      it('Should update when not empty', async () => {
        const channels: Channels = [
          { id: '1', name: 'channel1' },
          { id: '2', name: 'channel2' },
          { id: '3', name: 'thread1', thread: true },
        ]
        const iter = await getSlackIterator({ id123: 'new' }, channels)
        const messages = [
          {
            joinedAt: '2020-01-01T00:00:00.000Z',
            id: 'id124',
            username: 'new2',
          },
        ]
        await iter.parseMembers(messages)
        const expected = { id123: 'new', id124: 'new2' }
        expect(iter.members).toStrictEqual(expected)
      })
    })
  })

  describe('isRetrospectOver tests', () => {
    it('Should be over when the timestamp is 2 days old', async () => {
      const isOver = SlackIterator.isRetrospectOver(
        {
          timestamp: moment().utc().subtract(2, 'days').toDate(),
        },
        moment().utc().unix(),
        SlackIterator.maxRetrospect,
      )
      expect(isOver).toBe(true)
    })

    it('Should not be over when the timestamp is recent', async () => {
      const isOver = SlackIterator.isRetrospectOver(
        {
          timestamp: moment().utc().subtract(20, 'minutes').toDate(),
        },
        moment().utc().unix(),
        SlackIterator.maxRetrospect,
      )
      expect(isOver).toBe(false)
    })
  })

  describe('isEndPointFinished (with integration specific) tests', () => {
    const recentRecord = {
      timestamp: moment().utc().subtract(20, 'minutes').toDate(),
      more: 'stuff',
    }
    const oldRecord = {
      timestamp: moment().utc().subtract(4, 'days').toDate(),
      more: 'stuff',
    }

    const channels: Channels = [
      { id: '1', name: 'channel1' },
      { id: '2', name: 'channel2' },
      { id: '4', name: 'c4New', new: true },
    ]

    describe('Without onboarding', () => {
      it('Should not be finished for an unseen member', async () => {
        const iter = await getSlackIterator({ id1: 'username1' }, channels)
        const record = { sourceId: 'id2' }
        const isOver = iter.integrationSpecificIsEndpointFinished('members', record)
        const isOverGeneral = iter.isEndpointFinished('1', record, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for a seen member', async () => {
        const iter = await getSlackIterator({ id1: 'username1', id2: 'username2' }, channels)
        const record = { sourceId: 'id2' }
        const isOver = iter.integrationSpecificIsEndpointFinished('members', record)
        const isOverGeneral = iter.isEndpointFinished('members', record, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(true)
      })

      it('Should not be finished for a recent record when not onboarding on a normal channel', async () => {
        const iter = await getSlackIterator({}, channels)
        const isOver = iter.integrationSpecificIsEndpointFinished('1', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('1', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a new channel', async () => {
        const iter = await getSlackIterator({}, channels)
        const isOver = iter.integrationSpecificIsEndpointFinished('4', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('4', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a thread', async () => {
        const iter = await getSlackIterator({}, channels)
        const endpoint = iter.encodeThreadEndpoint('threadId', '1', 'Placehoolder here')
        const isOver = iter.integrationSpecificIsEndpointFinished(endpoint, recentRecord)
        const isOverGeneral = iter.isEndpointFinished(endpoint, recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for an old record when not onboarding on a normal channel', async () => {
        const iter = await getSlackIterator({}, channels)
        const isOver = iter.integrationSpecificIsEndpointFinished('1', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('1', oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(true)
      })

      it('Should be finished for an old record when not onboarding on thread', async () => {
        const iter = await getSlackIterator({}, channels)
        const endpoint = iter.encodeThreadEndpoint('threadId', '1', 'Placehoolder here')
        const isOver = iter.integrationSpecificIsEndpointFinished(endpoint, oldRecord)
        const isOverGeneral = iter.isEndpointFinished(endpoint, oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(true)
      })

      it('Should not be finished for an old record when not onboarding on a new channel', async () => {
        const iter = await getSlackIterator({}, channels)
        const isOver = iter.integrationSpecificIsEndpointFinished('4', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('4', oldRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })
    })

    describe('With onboarding', () => {
      it('Should not be finished for a recent record when onboarding on a normal channel', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = true
        const isOver = iter.integrationSpecificIsEndpointFinished('1', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('1', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a new channel', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = true
        const isOver = iter.integrationSpecificIsEndpointFinished('4', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('4', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a thread', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = true
        const endpoint = iter.encodeThreadEndpoint('threadId', '1', 'Placehoolder here')
        const isOver = iter.integrationSpecificIsEndpointFinished(endpoint, recentRecord)
        const isOverGeneral = iter.isEndpointFinished(endpoint, recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for an old record when onboarding on a normal channel', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = true
        const isOver = iter.integrationSpecificIsEndpointFinished('1', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('1', oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for an old record when onboarding on thread', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = true
        const endpoint = iter.encodeThreadEndpoint('threadId', '1', 'Placehoolder here')
        const isOver = iter.integrationSpecificIsEndpointFinished(endpoint, oldRecord)
        const isOverGeneral = iter.isEndpointFinished(endpoint, oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for an old record when not onboarding on a new channel', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = false
        const isOver = iter.integrationSpecificIsEndpointFinished('4', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('4', oldRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for an old record when a thread is found on a new channel', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = false
        const endpoint = iter.encodeThreadEndpoint('threadId', '4', 'here')
        const isOver = iter.integrationSpecificIsEndpointFinished(endpoint, oldRecord)
        const isOverGeneral = iter.isEndpointFinished(endpoint, oldRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should return finished for an empty record', async () => {
        const iter = await getSlackIterator({}, channels)
        iter.onboarding = true
        const isOverGeneral = iter.isEndpointFinished('4', {}, [])
        expect(isOverGeneral).toBe(true)
      })
    })
  })

  describe('Thread encode and decode tests', () => {
    it('It should encode a thread properly', async () => {
      const iter = await getSlackIterator({}, [{ name: 'channel1', id: 'channelId' }])

      const thread = iter.encodeThreadEndpoint('thread123', 'channelId', 'First message body')
      const expected =
        '{"threadId":"thread123","channel":"channel1","channelId":"channelId","placeholder":"First message body","new":false}'
      expect(thread).toBe(expected)
    })

    it('It should decode a thread properly', async () => {
      const encoded =
        '{"threadId":"thread123","channel":"channel1","channelId":"channelId","placeholder":"First message body","new":false}'
      const decoded = BaseIterator.decodeEndpoint(encoded)
      const expected = {
        threadId: 'thread123',
        channel: 'channel1',
        channelId: 'channelId',
        placeholder: 'First message body',
        new: false,
      }

      expect(decoded).toStrictEqual(expected)
    })

    it('It should encode a thread properly when the channel is new', async () => {
      const iter = await getSlackIterator({}, [
        {
          name: 'channel1',
          id: 'channelId',
          new: true,
        } as any,
      ])

      const thread = iter.encodeThreadEndpoint('thread123', 'channelId', 'First message body')
      const expected =
        '{"threadId":"thread123","channel":"channel1","channelId":"channelId","placeholder":"First message body","new":true}'
      expect(thread).toBe(expected)
    })

    it('It should decode a thread properly when the channel is new', async () => {
      const encoded =
        '{"threadId":"thread123","channel":"channel1","placeholder":"First message body","new":true}'
      const decoded = BaseIterator.decodeEndpoint(encoded)
      const expected = {
        threadId: 'thread123',
        channel: 'channel1',
        placeholder: 'First message body',
        new: true,
      }
      expect(decoded).toStrictEqual(expected)
    })

    it('It should add a thread to the endpointsIterator list right after the endpoint we are at not', async () => {
      const iter = await getSlackIterator({}, [
        { name: 'channel1', id: 'channelId' },
        { name: 'channel2', id: 'channelId2' },
      ])
      iter.addThreadToEndpoints('thread123', 'channelId', 'First message body')

      const expected = [
        'members',
        'channelId',
        '{"threadId":"thread123","channel":"channel1","channelId":"channelId","placeholder":"First message body","new":false}',
        'channelId2',
      ]
      expect(iter.endpointsIterator).toStrictEqual(expected)
    })

    it('It should add a thread to the endpointsIterator list when endpoint is not the first', async () => {
      const iter = await getSlackIterator({}, [
        { name: 'channel0', id: 'channelId0' },
        { name: 'channel1', id: 'channelId' },
        { name: 'channel2', id: 'channelId2' },
      ])
      iter.addThreadToEndpoints('thread123', 'channelId', 'First message body')

      const expected = [
        'members',
        'channelId0',
        'channelId',
        '{"threadId":"thread123","channel":"channel1","channelId":"channelId","placeholder":"First message body","new":false}',
        'channelId2',
      ]
      expect(iter.endpointsIterator).toStrictEqual(expected)
    })

    it('It should add a thread to the endpointsIterator list for a minimal case', async () => {
      const iter = await getSlackIterator({}, [{ name: 'channel1', id: 'channelId' }])
      iter.addThreadToEndpoints('thread123', 'channelId', 'First message body')

      const expected = [
        'members',
        'channelId',
        '{"threadId":"thread123","channel":"channel1","channelId":"channelId","placeholder":"First message body","new":false}',
      ]
      expect(iter.endpointsIterator).toStrictEqual(expected)
    })
  })

  describe('Get usecase tests', () => {
    it('It should pick members when endpoint is members', async () => {
      const getMembers = require('../../usecases/chat/getMembers').default
      const expeced = { fn: getMembers, arg: '' }
      expect(SlackIterator.getSuperfaceUsecase('members', '')).toStrictEqual(expeced)
    })

    it('It should pick normal messages when endpoint is a channel id', async () => {
      const getMessagesThreads = require('../../usecases/chat/getMessagesThreads').default
      const expeced = {
        fn: getMessagesThreads,
        arg: 'threadIsInTheEndpoint',
      }
      expect(SlackIterator.getSuperfaceUsecase('threadIsInTheEndpoint', '')).toStrictEqual(expeced)
    })

    it('It should pick normal messages when endpoint is a channel id', async () => {
      const getMessages = require('../../usecases/chat/getMessages').default
      const expeced = {
        fn: getMessages,
        arg: 'channelIdHere',
      }
      expect(SlackIterator.getSuperfaceUsecase('channelIdHere', '')).toStrictEqual(expeced)
    })
  })

  describe('Switch Cases tests', () => {
    it('Should pick members when endpoint is members', async () => {
      expect(SlackIterator.switchCases('members')).toBe('members')
    })

    it('Should pick threads when thread is sent', async () => {
      const iter = await getSlackIterator({}, [{ name: 'channel1', id: 'channelId' }])
      expect(
        SlackIterator.switchCases(iter.encodeThreadEndpoint('threadId', 'channelId', '')),
      ).toBe('threads')
    })

    it('Should pick the endpoint otherwise', async () => {
      expect(SlackIterator.switchCases('id1')).toBe('id1')
    })
  })

  describe('Thread discovery tests', () => {
    it('Should discover a thread and add it to the endpoints when parsing a message that is a thread starter', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator({ a12345: 'username' }, channels)

      expect(iter.endpointsIterator).toStrictEqual(['members', '1', '2', '3'])

      const messages = [
        {
          id: '12345',
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
          },
          text: 'body here',
          hasThread: true,
          threadId: 'thread1',
        },
      ]

      iter.parseMessages(messages, '2')
      expect(iter.endpointsIterator).toStrictEqual([
        'members',
        '1',
        '2',
        '{"threadId":"thread1","channel":"channel2","channelId":"2","placeholder":"body here","new":false}',
        '3',
      ])
    })

    it('Should not touch endpoints iterator when there parsing  thread', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = await getSlackIterator({ a12345: 'username' }, channels)
      const endpoints = ['members', '1', '2', '3']
      expect(iter.endpointsIterator).toStrictEqual(endpoints)

      const threadEncoded = iter.encodeThreadEndpoint('threadId', '2', 'here')

      const messages = [
        {
          id: '12345',
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
          },
          text: 'body here',
          hasThread: true,
          threadId: 'thread1',
        },
      ]

      iter.parseMessagesInThreads(messages, threadEncoded)
      expect(iter.endpointsIterator).toStrictEqual(endpoints)
    })
  })
})
