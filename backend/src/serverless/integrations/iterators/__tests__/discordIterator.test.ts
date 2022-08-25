import { SuperfaceClient } from '@superfaceai/one-sdk'
import moment from 'moment'
import { DiscordGrid } from '../../grid/discordGrid'
import { Channels } from '../../types/regularTypes'
import BaseIterator from '../baseIterator'
import DiscordIterator from '../discordIterator'
import { PlatformType } from '../../../../utils/platforms'

describe('Discord iterator tests', () => {
  const superfaceMock = {} as SuperfaceClient
  describe('Init tests', () => {
    it('It should initialise endpoints properly', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      expect(iter.endpoints).toEqual(['members', '1', '2', '3'])
    })

    it('It should initialise endpoints without channels', async () => {
      const channels: Channels = []
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      expect(iter.endpoints).toEqual(['members'])
    })

    it('It should initialise endpoints properly without threads', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      expect(iter.endpoints).toEqual(['members', '1', '2'])
    })
  })

  describe('Channel name tests', () => {
    it('It get the channel names with threads', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      expect(iter.channelsInfo).toEqual({
        '1': {
          name: 'channel1',
          thread: false,
          new: false,
        },
        '2': {
          name: 'channel2',
          thread: false,
          new: false,
        },
        '3': { name: 'thread1', thread: true, new: false },
      })
    })
  })

  describe('Remove mention tests', () => {
    it('It should remove a mention from a message', async () => {
      const text = 'Hey <@user1>'
      expect(DiscordIterator.removeMentions(text)).toEqual('Hey @mention')
    })

    it('It should remove several mention from a message', async () => {
      const text = 'Hey <@user1> and <@user2>'
      expect(DiscordIterator.removeMentions(text)).toEqual('Hey @mention and @mention')
    })

    it('It should swap conescutive mentios for @mentions', async () => {
      const text = 'Hey <@user1><@user2>'
      expect(DiscordIterator.removeMentions(text)).toEqual('Hey @mentions')
    })

    it('It should swap a mess of mentions for @mentions', async () => {
      const text = 'Hey <@user1><@user2> <@!user3><@!user4> <@user5>'
      expect(DiscordIterator.removeMentions(text)).toEqual('Hey @mentions')
    })
  })

  describe('Parse messages tests', () => {
    it('It should parse a message from a normal channel', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          id: '12345',
          text: 'body here',
          reactions: ['1', '2', '3'],
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '',
          timestamp: moment(Date.parse('2020-01-01T00:00:00.000Z')).toDate(),
          crowdInfo: {
            body: 'body here',
            url: 'https://discordapp.com/channels/guild12345/1/12345',
            channel: 'channel1',
            thread: false,
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          communityMember: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })

    it('It should parse a message with from a thread', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          id: '12345',
          text: 'body here',
          reactions: ['1', '2', '3'],
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '3',
          timestamp: moment(Date.parse('2020-01-01T00:00:00.000Z')).toDate(),
          crowdInfo: {
            body: 'body here',
            url: 'https://discordapp.com/channels/guild12345/3/12345',
            channel: 'thread1',
            thread: 'thread1',
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          communityMember: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessages(messages, '3')
      expect(received).toStrictEqual(expected)
    })

    it('It should parse a threadStarter message from a channel', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          id: '12345',
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
            username: 'username',
          },
          hasThread: true,
        },
      ]
      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '',
          timestamp: moment(Date.parse('2020-01-01T00:00:00.000Z')).toDate(),
          crowdInfo: {
            body: '',
            url: 'https://discordapp.com/channels/guild12345/1/12345',
            channel: 'channel1',
            thread: false,
            reactions: [],
            attachments: [],
            threadStarter: true,
          },
          communityMember: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
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
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          id: '12345',
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '',
          timestamp: moment(Date.parse('2020-01-01T00:00:00.000Z')).toDate(),
          crowdInfo: {
            body: '',
            url: 'https://discordapp.com/channels/guild12345/1/12345',
            channel: 'channel1',
            thread: false,
            reactions: [],
            attachments: [],
          },
          communityMember: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
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
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          id: '12345',
          text: 'body here <@user1> and <@!user2> <@user3>',
          reactions: ['1', '2', '3'],
          createdAt: '2020-01-01T00:00:00.000Z',
          author: {
            id: 'a12345',
            username: 'username',
          },
        },
      ]
      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.DISCORD,
          type: 'message',
          sourceId: '12345',
          sourceParentId: '',
          timestamp: moment(Date.parse('2020-01-01T00:00:00.000Z')).toDate(),
          crowdInfo: {
            body: 'body here @mention and @mentions',
            url: 'https://discordapp.com/channels/guild12345/1/12345',
            channel: 'channel1',
            thread: false,
            reactions: ['1', '2', '3'],
            attachments: [],
          },
          communityMember: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: DiscordGrid.message.score,
          isKeyAction: DiscordGrid.message.isKeyAction,
        },
      ]
      const received = iter.parseMessages(messages, '1')
      expect(received).toStrictEqual(expected)
    })
  })

  describe('Parse members tests', () => {
    it('It should parse a normal member', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          joinedAt: '2020-01-01T00:00:00.000Z',
          id: 'a12345',
          username: 'username',
        },
      ]
      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.DISCORD,
          type: 'joined_guild',
          sourceId: BaseIterator.generateSourceIdHash(
            messages[0].id,
            'joined_guild',
            moment('2020-01-01T00:00:00.000Z').utc().unix().toString(),
            PlatformType.DISCORD,
          ),
          timestamp: moment(Date.parse('2020-01-01T00:00:00.000Z')).toDate(),
          crowdInfo: {},
          communityMember: {
            username: 'username',
            crowdInfo: {
              id: 'a12345',
            },
          },
          score: DiscordGrid.join.score,
          isKeyAction: DiscordGrid.join.isKeyAction,
        },
      ]
      const received = iter.parseMembers(messages)
      expect(received).toStrictEqual(expected)
    })

    it('It not return anything for a bot member', async () => {
      const channels: Channels = [
        { id: '1', name: 'channel1' },
        { id: '2', name: 'channel2' },
        { id: '3', name: 'thread1', thread: true },
      ]
      const iter = new DiscordIterator(
        superfaceMock,
        'tenant12345',
        'guild12345',
        'token12345',
        channels,
      )
      const messages = [
        {
          joinedAt: '2020-01-01T00:00:00.000Z',
          id: 'a12345',
          username: 'username',
          isBot: true,
        },
      ]
      const expected = []
      const received = iter.parseMembers(messages)
      expect(received).toStrictEqual(expected)
    })
  })

  describe('isRetrospectOver tests', () => {
    it('Should be over when the timestamp is 2 days old', async () => {
      const isOver = DiscordIterator.isRetrospectOver(
        {
          timestamp: moment().utc().subtract(2, 'days').toDate(),
        },
        moment().utc().unix(),
        DiscordIterator.maxRetrospect,
      )
      expect(isOver).toBe(true)
    })

    it('Should not be over when the timestamp is recent', async () => {
      const isOver = DiscordIterator.isRetrospectOver(
        {
          timestamp: moment().utc().subtract(20, 'minutes').toDate(),
        },
        moment().utc().unix(),
        DiscordIterator.maxRetrospect,
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
      { id: '3', name: 'thread1', thread: true },
      { id: '4', name: 'c4New', new: true },
    ]

    describe('Without onboarding', () => {
      it('Should not be finished for a recent record when not onboarding on a normal channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('1', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('1', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a new channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('4', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('4', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a thread', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('3', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('2', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for an old record when not onboarding on a normal channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('1', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('1', oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(true)
      })

      it('Should be finished for an old record when not onboarding on thread', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('3', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('3', oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(true)
      })

      it('Should not be finished for an old record when not onboarding on a new channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('4', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('4', oldRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })
    })

    describe('With onboarding', () => {
      it('Should not be finished for a recent record when not onboarding on a normal channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('1', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('1', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a new channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('4', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('4', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for a recent record when not onboarding on a thread', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('3', recentRecord)
        const isOverGeneral = iter.isEndpointFinished('2', recentRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for an old record when not onboarding on a normal channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('1', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('1', oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(false)
      })

      it('Should be finished for an old record when not onboarding on thread', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('3', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('3', oldRecord, [])
        expect(isOver).toBe(true)
        expect(isOverGeneral).toBe(false)
      })

      it('Should not be finished for an old record when not onboarding on a new channel', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOver = iter.integrationSpecificIsEndpointFinished('4', oldRecord)
        const isOverGeneral = iter.isEndpointFinished('4', oldRecord, [])
        expect(isOver).toBe(false)
        expect(isOverGeneral).toBe(false)
      })

      it('Should return finished for an empty record', async () => {
        const iter = new DiscordIterator(
          superfaceMock,
          'tenant12345',
          'guild12345',
          'token12345',
          channels,
          { endpoint: '', page: '' },
          true,
        )
        const isOverGeneral = iter.isEndpointFinished('4', {}, [])
        expect(isOverGeneral).toBe(true)
      })
    })
  })
})
