import moment from 'moment'
import { TwitterIntegrationMessage } from '../../types/messageTypes'
import getFollowers from '../../usecases/social/followers'
import findPostsByHashtag from '../../usecases/social/postsByHashtag'
import findPostsByMention from '../../usecases/social/postsByMention'
import BaseIterator from '../baseIterator'
import TwitterIterator from '../twitterIterator'
import { TwitterGrid } from '../../grid/twitterGrid'
import { PlatformType } from '../../../../types/integrationEnums'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'

describe('Integrations worker static tests', () => {
  describe('Init tests', () => {
    it('It should initialise endpoints properly', async () => {
      const hashtags = ['#1', '#2']
      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', hashtags)
      expect(iter.endpoints).toEqual(['followers', 'mentions', 'hashtag/#1', 'hashtag/#2'])
    })

    it('It should initialise endpoints properly without hashtags', async () => {
      const hashtags = []
      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', hashtags)
      expect(iter.endpoints).toEqual(['followers', 'mentions'])
    })
  })

  describe('Test fo function to get usecases', () => {
    it('It should return the mentions usecase', async () => {
      const usecaseOut = TwitterIterator.getSuperfaceUsecase('mentions', 'profile12345')
      expect(usecaseOut.fn).toBe(findPostsByMention)
      expect(usecaseOut.arg).toBe('profile12345')
    })

    it('It should return the followers usecase', async () => {
      const usecaseOut = TwitterIterator.getSuperfaceUsecase('followers', 'profile12345')
      expect(usecaseOut.fn).toBe(getFollowers)
      expect(usecaseOut.arg).toBe('profile12345')
    })

    it('It should return the hashtags usecase with the correct hashtag', async () => {
      const usecaseOut = TwitterIterator.getSuperfaceUsecase('hashtag/#2', 'profile12345')
      expect(usecaseOut.fn).toBe(findPostsByHashtag)
      expect(usecaseOut.arg).toBe('2')
    })
  })

  describe('Test fo function to get SQS message body', () => {
    it('It should return the proper message', async () => {
      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const message: TwitterIntegrationMessage = iter.getSQSBody(
        { endpoint: 'hashtag/#1', page: '1', endpoints: [] },
        42,
      )
      expect(message).toStrictEqual({
        tenant: 'tenant12345',
        integration: PlatformType.TWITTER,
        onboarding: false,
        state: { endpoint: 'hashtag/#1', page: '1', endpoints: [] },
        sleep: 42,
        args: {
          profileId: 'profile12345',
          hashtags: ['#1', '#2'],
        },
      })
    })
  })

  describe('Test parsing of posts', () => {
    it('It should return an activity with a member', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '3333333',
            username: 'johndoe',
            followersCount: 100,
          },
        },
        {
          id: '123456789',
          createdAt: '2022-02-03T08:20:04.000Z',
          text: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '444444',
            username: 'gilfoyle',
            followersCount: 10,
            url: 'https://twitter.com/gilfoyle',
          },
        },
      ]

      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'mention',
          sourceId: '1234567',
          timestamp: moment(Date.parse('2022-02-02T08:20:04.000Z')).toDate(),
          body: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attributes: {
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'johndoe',
            reach: { [PlatformType.TWITTER]: 100 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '3333333',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/johndoe',
              },
            },
          },
          isKeyAction: TwitterGrid.mention.isKeyAction,
          score: TwitterGrid.mention.score,
        },
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'mention',
          sourceId: '123456789',
          timestamp: moment(Date.parse('2022-02-03T08:20:04.000Z')).toDate(),
          body: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attributes: {
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'gilfoyle',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '444444',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/gilfoyle',
              },
            },
          },
          isKeyAction: TwitterGrid.mention.isKeyAction,
          score: TwitterGrid.mention.score,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const messages = iter.parsePosts(tweets, 'mentions')
      expect(messages).toEqual(expected)
    })

    it('It should work with only one', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            followersCount: 1,
            id: '3333333',
            username: 'johndoe',
          },
        },
      ]

      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'mention',
          sourceId: '1234567',
          timestamp: moment(Date.parse('2022-02-02T08:20:04.000Z')).toDate(),
          body: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attributes: {
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'johndoe',
            reach: { [PlatformType.TWITTER]: 1 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '3333333',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/johndoe',
              },
            },
          },
          isKeyAction: TwitterGrid.mention.isKeyAction,
          score: TwitterGrid.mention.score,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const messages = iter.parsePosts(tweets, 'mentions')
      expect(messages).toEqual(expected)
    })

    it('It should work barebones', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          url: '',
          author: {
            id: '3333333',
            username: 'johndoe',
            followersCount: 1,
          },
        },
      ]

      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'mention',
          sourceId: '1234567',
          timestamp: moment(Date.parse('2022-02-02T08:20:04.000Z')).toDate(),
          body: '',
          url: '',
          attributes: {
            attachments: [],
          },
          member: {
            username: 'johndoe',
            reach: { [PlatformType.TWITTER]: 1 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '3333333',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/johndoe',
              },
            },
          },
          isKeyAction: TwitterGrid.mention.isKeyAction,
          score: TwitterGrid.mention.score,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const messages = iter.parsePosts(tweets, 'mentions')
      expect(messages).toEqual(expected)
    })

    it('It should work with hashtag endpoint', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '3333333',
            username: 'johndoe',
            followersCount: 10,
          },
        },
      ]

      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'hashtag',
          sourceId: '1234567',
          timestamp: moment(Date.parse('2022-02-02T08:20:04.000Z')).toDate(),
          body: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attributes: {
            hashtag: '1234',
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'johndoe',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '3333333',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/johndoe',
              },
            },
          },
          isKeyAction: TwitterGrid.hashtag.isKeyAction,
          score: TwitterGrid.hashtag.score,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const messages = iter.parsePosts(tweets, 'hashtag/#1234')
      expect(messages).toEqual(expected)
    })
  })

  describe('Test parsing of followers', () => {
    it('It should return a follow activity with a member', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 1,
        },
        {
          id: '1466796521412771841',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 30,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const activities = iter.parseFollowers(followers)
      expect(moment(activities[0].timestamp).unix()).toBeCloseTo(moment().utc().unix())
      const activitiesNoTs = activities.map((a) => {
        const ret = { ...a, timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate() }
        return ret
      })

      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'michael_scott',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/michael_scott',
          member: {
            username: 'michael_scott',
            reach: { [PlatformType.TWITTER]: 1 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771840',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/michael_scott',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'dwight_schrute',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/dwight_schrute',
          member: {
            username: 'dwight_schrute',
            reach: { [PlatformType.TWITTER]: 30 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771841',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/dwight_schrute',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
      ]

      expect(activitiesNoTs).toEqual(expected)
    })

    it('It should return work with one', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 1,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const activities = iter.parseFollowers(followers)
      expect(moment(activities[0].timestamp).unix()).toBeCloseTo(moment().utc().unix())
      const activitiesNoTs = activities.map((a) => {
        const ret = { ...a, timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate() }
        return ret
      })

      const expected = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'michael_scott',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/michael_scott',
          member: {
            username: 'michael_scott',
            reach: { [PlatformType.TWITTER]: 1 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771840',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/michael_scott',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
      ]

      expect(activitiesNoTs).toEqual(expected)
    })

    it('It should work when its empty', async () => {
      const followers = []

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const messages = iter.parseFollowers(followers)
      expect(messages).toEqual([])
    })
  })

  describe('Test getMessageAndDate with followers', () => {
    it('Without onboarding: it should return the current moment', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 1,
        },
        {
          id: '1466796521412771840',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 30,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const { activities } = iter.parseActivities(followers, 'followers')
      expect(moment(activities[0].timestamp).unix()).toBeCloseTo(moment().utc().unix())
      const activitiesNoTs = activities.map((a) => {
        const ret = { ...a, timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate() }
        return ret
      })

      const expectedMessages = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'michael_scott',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/michael_scott',
          member: {
            username: 'michael_scott',
            reach: { [PlatformType.TWITTER]: 1 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771840',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/michael_scott',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'dwight_schrute',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/dwight_schrute',
          member: {
            username: 'dwight_schrute',
            reach: { [PlatformType.TWITTER]: 30 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771840',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/dwight_schrute',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
      ]

      expect(activitiesNoTs).toEqual(expectedMessages)
    })

    it('With onboarding: it should return a date in the past', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 10,
        },
        {
          id: '1466796521412771840',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
          followersCount: 10,
        },
      ]

      const expectedMessages = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'michael_scott',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/michael_scott',
          member: {
            username: 'michael_scott',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771840',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/michael_scott',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'follow',
          sourceId: BaseIterator.generateSourceIdHash(
            'dwight_schrute',
            'follow',
            '0',
            PlatformType.TWITTER,
          ),
          timestamp: moment('1970-01-01T00:00:00+00:00').utc().toDate(),
          url: 'https://twitter.com/dwight_schrute',
          member: {
            username: 'dwight_schrute',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '1466796521412771840',
              },
              [MemberAttributeName.IMAGE_URL]: {
                [PlatformType.TWITTER]:
                  'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/dwight_schrute',
              },
            },
          },
          score: 2,
          isKeyAction: false,
        },
      ]

      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
      )
      const { activities } = iter.parseActivities(followers, 'followers')
      expect(activities).toEqual(expectedMessages)
    })
  })

  describe('Test getMessagesAndDate with posts lookup', () => {
    it('It should return the messages and the last date in the list for mentions', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '3333333',
            username: 'johndoe',
            followersCount: 10,
          },
        },
        {
          id: '123456789',
          createdAt: '2022-02-01T08:20:04.000Z',
          text: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '444444',
            username: 'gilfoyle',
            followersCount: 10,
          },
        },
      ]

      const expectedMessages = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'mention',
          sourceId: '1234567',
          timestamp: moment(Date.parse('2022-02-02T08:20:04.000Z')).toDate(),
          body: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attributes: {
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'johndoe',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '3333333',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/johndoe',
              },
            },
          },
          isKeyAction: TwitterGrid.mention.isKeyAction,
          score: TwitterGrid.mention.score,
        },
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'mention',
          sourceId: '123456789',
          timestamp: moment(Date.parse('2022-02-01T08:20:04.000Z')).toDate(),
          body: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attributes: {
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'gilfoyle',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '444444',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/gilfoyle',
              },
            },
          },
          isKeyAction: TwitterGrid.mention.isKeyAction,
          score: TwitterGrid.mention.score,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const parseOutput = iter.parseActivities(tweets, 'mentions')
      expect(parseOutput.activities).toEqual(expectedMessages)
    })

    it('It should return the messages and the last date in the list for hashtags', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '3333333',
            username: 'johndoe',
            followersCount: 10,
          },
        },
        {
          id: '123456789',
          createdAt: '2022-02-01T08:20:04.000Z',
          text: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '444444',
            followersCount: 10,
            username: 'gilfoyle',
          },
        },
      ]

      const expectedMessages = [
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'hashtag',
          sourceId: '1234567',
          timestamp: moment(Date.parse('2022-02-02T08:20:04.000Z')).toDate(),
          body: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attributes: {
            hashtag: '1',
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'johndoe',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '3333333',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/johndoe',
              },
            },
          },
          isKeyAction: TwitterGrid.hashtag.isKeyAction,
          score: TwitterGrid.hashtag.score,
        },
        {
          tenant: 'tenant12345',
          platform: PlatformType.TWITTER,
          type: 'hashtag',
          sourceId: '123456789',
          timestamp: moment(Date.parse('2022-02-01T08:20:04.000Z')).toDate(),
          body: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attributes: {
            hashtag: '1',
            attachments: [
              {
                type: 'photo',
                url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
                height: 360,
                width: 480,
              },
            ],
          },
          member: {
            username: 'gilfoyle',
            reach: { [PlatformType.TWITTER]: 10 },
            attributes: {
              [MemberAttributeName.SOURCE_ID]: {
                [PlatformType.TWITTER]: '444444',
              },
              [MemberAttributeName.URL]: {
                [PlatformType.TWITTER]: 'https://twitter.com/gilfoyle',
              },
            },
          },
          isKeyAction: TwitterGrid.hashtag.isKeyAction,
          score: TwitterGrid.hashtag.score,
        },
      ]

      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      const { activities } = iter.parseActivities(tweets, 'hashtag#1')
      expect(activities).toEqual(expectedMessages)
    })
  })

  describe('Map to path tests', () => {
    it('Should map to a path correctly for a complex path', () => {
      const out = TwitterIterator.mapToPath(
        [
          {
            attributes: {
              sourceId: '1',
            },
          },
          {
            attributes: {
              sourceId: '2',
            },
          },
        ],
        'attributes.sourceId',
      )
      expect(out).toEqual(['1', '2'])
    })

    it('Should map to a path correctly for a simple path', () => {
      const out = TwitterIterator.mapToPath([{ sourceId: '1' }, { sourceId: '2' }], 'sourceId')
      expect(out).toEqual(['1', '2'])
    })

    it('Should return an empty list for an empty list', () => {
      const out = TwitterIterator.mapToPath([], 'sourceId')
      expect(out).toEqual([])
    })
  })

  describe('IsJoin tests', () => {
    it('Should return no join when all elements from an array and a set are differnet', () => {
      const set = new Set(['1', '2', '3'])
      const array = ['4', '5', '6']
      const out = TwitterIterator.isJoin(set, array)
      expect(out).toBe(false)
    })

    it('Should return join when any element is the same', () => {
      const set = new Set(['1', '4', '3'])
      const array = ['4', '5', '6']
      const out = TwitterIterator.isJoin(set, array)
      expect(out).toBe(true)
    })

    it('Should return join when all elements', () => {
      const set = new Set(['1', '4', '3'])
      const array = ['4', '1', '3']
      const out = TwitterIterator.isJoin(set, array)
      expect(out).toBe(true)
    })
  })

  describe('IsEndpointFinisished tests for followers', () => {
    it('Should return the endpoint is not finished for an unseen list of followers', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        10,
        existingFollowers,
      )
      const incoming = [
        {
          timestamp: moment().utc().toDate(),
          type: 'activity',
          platform: 'api',
          tenant: 'tenant12345',
          member: {
            attributes: {
              [PlatformType.TWITTER]: {
                [MemberAttributeName.SOURCE_ID]: '5',
              },
            },
            username: 'johndoe',
          },
        },
        {
          timestamp: moment().utc().toDate(),
          type: 'activity',
          platform: 'api',
          tenant: 'tenant12345',
          member: {
            attributes: {
              [PlatformType.TWITTER]: {
                [MemberAttributeName.SOURCE_ID]: '4',
              },
            },
            username: 'johndoe',
          },
        },
      ]

      const isFinished = iter.integrationSpecificIsEndpointFinished(
        'followers',
        { id: '5', timestamp: moment().toDate() },
        incoming,
      )
      const isFinishedGeneral = iter.isEndpointFinished(
        'followers',
        { id: '5', timestamp: moment().toDate() },
        incoming,
      )
      expect(isFinished).toBe(false)
      expect(isFinishedGeneral).toBe(false)
    })

    it('Should return the endpoint is finished for a seen follower', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        10,
        existingFollowers,
      )
      const incoming = [
        {
          timestamp: moment().utc().toDate(),
          type: 'activity',
          platform: 'api',
          tenant: 'tenant12345',
          member: {
            attributes: {
              [PlatformType.TWITTER]: {
                [MemberAttributeName.SOURCE_ID]: '4',
              },
            },
            username: 'johndoe',
          },
        },
        {
          timestamp: moment().utc().toDate(),
          type: 'activity',
          platform: 'api',
          tenant: 'tenant12345',
          member: {
            attributes: {
              [PlatformType.TWITTER]: {
                [MemberAttributeName.SOURCE_ID]: '1',
              },
            },
            username: 'johndoe',
          },
        },
      ]

      const isFinished = iter.integrationSpecificIsEndpointFinished(
        'followers',
        { id: '5', timestamp: moment().utc().toDate() },
        incoming,
      )
      const isFinishedGeneral = iter.isEndpointFinished(
        'followers',
        { id: '5', timestamp: moment().utc().toDate() },
        incoming,
      )
      expect(isFinished).toBe(true)
      expect(isFinishedGeneral).toBe(true)
    })
  })

  describe('IsEndpointFinisished tests for mentions and hashtags', () => {
    const recent = moment().utc().subtract(20, 'minutes').toDate()
    const old = moment().utc().subtract(2.1, 'hours').toDate()

    it('Should return the endpoint not finished for recent post', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        10,
        existingFollowers,
      )

      const isFinished = iter.integrationSpecificIsEndpointFinished(
        'mentions',
        { id: '5', timestamp: recent },
        [],
      )
      const isFinishedGeneral = iter.isEndpointFinished(
        'mentions',
        { id: '5', timestamp: recent },
        [],
      )
      expect(isFinished).toBe(false)
      expect(isFinishedGeneral).toBe(false)

      const isFinishedHashtags = iter.integrationSpecificIsEndpointFinished(
        'hashtags',
        { id: '5', timestamp: recent },
        [],
      )
      const isFinishedGeneralHashtags = iter.isEndpointFinished(
        'hashtags',
        { id: '5', timestamp: recent },
        [],
      )
      expect(isFinishedHashtags).toBe(false)
      expect(isFinishedGeneralHashtags).toBe(false)
    })

    it('Should return the endpoint finished for an older post', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        10,
        existingFollowers,
      )

      const isFinished = iter.integrationSpecificIsEndpointFinished(
        'mentions',
        { id: '5', timestamp: old },
        [],
      )
      const isFinishedGeneral = iter.isEndpointFinished('mentions', { id: '5', timestamp: old }, [])
      expect(isFinished).toBe(true)
      expect(isFinishedGeneral).toBe(true)

      const isFinishedHashtags = iter.integrationSpecificIsEndpointFinished(
        'mentions',
        { id: '5', timestamp: old },
        [],
      )
      const isFinishedGeneralHashtags = iter.isEndpointFinished(
        'mentions',
        { id: '5', timestamp: old },
        [],
      )
      expect(isFinishedHashtags).toBe(true)
      expect(isFinishedGeneralHashtags).toBe(true)
    })

    it('Should return the endpoint finished for an empty post', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        10,
        existingFollowers,
      )

      const isFinishedGeneral = iter.isEndpointFinished('mentions', {}, [])
      expect(isFinishedGeneral).toBe(true)

      const isFinishedGeneralHashtags = iter.isEndpointFinished('mentions', {}, [])
      expect(isFinishedGeneralHashtags).toBe(true)
    })

    it('Should return the endpoint finished for an empty post with onboarding', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        10,
        existingFollowers,
      )

      const isFinishedGeneral = iter.isEndpointFinished('mentions', {}, [])
      expect(isFinishedGeneral).toBe(true)
    })

    it('Should return the endpoint is not finished for an old post with onboarding', () => {
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        10,
        existingFollowers,
      )

      const isFinishedGeneral = iter.isEndpointFinished('mentions', { id: '5', timestamp: old }, [])
      expect(isFinishedGeneral).toBe(false)
    })
  })

  describe('Test the increment of followers', () => {
    it('It should update an empty set of followers', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
        {
          id: '1466796521412771841',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
      ]
      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'])
      iter.parseActivities(followers, 'followers')
      expect(iter.followers).toStrictEqual(new Set(['1466796521412771840', '1466796521412771841']))
    })

    it('It should update an existing set of followers', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
        {
          id: '1466796521412771841',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
      ]
      const existingFollowers = new Set(['1', '2', '3'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        10,
        existingFollowers,
      )
      iter.parseActivities(followers, 'followers')
      expect(iter.followers).toStrictEqual(
        new Set([...existingFollowers, ...['1466796521412771840', '1466796521412771841']]),
      )
    })

    it('It should filter out the followers that already existed', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
        {
          id: '1466796521412771841',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
      ]
      const existingFollowers = new Set(['1', '2', '1466796521412771840'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        10,
        existingFollowers,
      )
      const out = iter.parseActivities(followers, 'followers')
      expect(out.activities.length).toBe(1)
    })

    it('It should filter out the followers that already existed', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
        {
          id: '1466796521412771841',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
      ]
      const existingFollowers = new Set(['1', '2', '1466796521412771840', '1466796521412771841'])
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        10,
        existingFollowers,
      )
      const out = iter.parseActivities(followers, 'followers')
      expect(out.activities.length).toBe(0)
    })
  })

  describe('Test the increment of number of tweets', () => {
    const initialCount = 10
    it('It should not increase when adding followers', async () => {
      const followers = [
        {
          id: '1466796521412771840',
          username: 'michael_scott',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
        {
          id: '1466796521412771841',
          username: 'dwight_schrute',
          imageUrl: 'https://pbs.twimg.com/profile_images/1478302204306067462/5BEbrnPO_normal.jpg',
        },
      ]
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        initialCount,
      )
      iter.parseActivities(followers, 'followers')
      expect(iter.limitCount).toBe(initialCount)
    })

    it('It should increase when adding mentions', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '3333333',
            username: 'johndoe',
          },
        },
        {
          id: '123456789',
          createdAt: '2022-02-03T08:20:04.000Z',
          text: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '444444',
            username: 'gilfoyle',
            url: 'https://twitter.com/gilfoyle',
          },
        },
      ]
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        initialCount,
      )
      iter.parseActivities(tweets, 'mentions')
      expect(iter.limitCount).toBe(initialCount + tweets.length)
    })

    it('It should increase when adding hashtags', async () => {
      const tweets = [
        {
          id: '1234567',
          createdAt: '2022-02-02T08:20:04.000Z',
          text: 'First message #apis',
          url: 'https://twitter.com/i/status/1234567',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '3333333',
            username: 'johndoe',
          },
        },
        {
          id: '123456789',
          createdAt: '2022-02-03T08:20:04.000Z',
          text: 'Second Message',
          url: 'https://twitter.com/i/status/123456798',
          attachments: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/FKk9-wpWUAEQ-Xs.jpg',
              height: 360,
              width: 480,
            },
          ],
          author: {
            id: '444444',
            username: 'gilfoyle',
            url: 'https://twitter.com/gilfoyle',
          },
        },
      ]
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        true,
        initialCount,
      )
      iter.parseActivities(tweets, 'hashtag#1')
      expect(iter.limitCount).toBe(initialCount + tweets.length)
    })
  })

  describe('Global limit tests', () => {
    it('It should not hit the global limit when we have not hit the target', async () => {
      const initialCount = 2000
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        initialCount,
      )
      const next = iter.next('followers', 'p124', {
        lastRecord: { id: '123' },
        activities: [],
        numberOfRecords: 1000,
      })
      expect(next).toStrictEqual({
        endpoint: 'followers',
        page: 'p124',
        endpoints: ['followers', 'mentions', 'hashtag/#1', 'hashtag/#2'],
      })
    })

    it('It should hit return the global limit when we have not hit the target', async () => {
      const initialCount = 10001
      const iter = new TwitterIterator(
        'tenant12345',
        'profile12345',
        'token',
        ['#1', '#2'],
        { endpoint: '', page: '', endpoints: [] },
        false,
        initialCount,
      )
      const next = iter.next('followers', 'p124', {
        lastRecord: { id: '123' },
        activities: [],
        numberOfRecords: 2,
      })
      expect(next).toStrictEqual(TwitterIterator.endState)
    })
  })

  describe('Get afterDate tests', () => {
    it('Should return a date', async () => {
      const iter = new TwitterIterator('tenant12345', 'profile12345', 'token', ['#1', '#2'], {
        endpoint: '',
        page: '',
        endpoints: [],
      })
      const date = iter.getAfterDate()
      expect(moment(date).unix()).toBeCloseTo(
        moment().utc().subtract(TwitterIterator.maxRetrospect, 'seconds').unix(),
      )
      expect(date).toBeDefined()
    })
  })

  describe('Get hashtag tests', () => {
    it('Should get the hashtag name without #', async () => {
      expect(TwitterIterator.getHashtag('hashtag/1')).toBe('1')
    })

    it('Should get the hashtag name with #', async () => {
      expect(TwitterIterator.getHashtag('hashtag/#1')).toBe('1')
    })
  })
})
