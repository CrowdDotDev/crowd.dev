import { IServiceOptions } from './../IServiceOptions'
import moment from 'moment'
import ConversationService from '../conversationService'
import ActivityRepository from '../../database/repositories/activityRepository'
import MemberRepository from '../../database/repositories/memberRepository'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import Plans from '../../security/plans'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import SearchEngineTestUtils from '../../search-engine/utils/searchEngineTestUtils'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import SettingsRepository from '../../database/repositories/settingsRepository'
import ConversationSearchEngineRepository from '../../search-engine/repositories/conversationSearchEngineRepository'
import SettingsSearchEngineRepository from '../../search-engine/repositories/settingsSearchEngineRepository'
import TenantRepository from '../../database/repositories/tenantRepository'
import Error400 from '../../errors/Error400'
import { PlatformType } from '@crowd/types'
import ActivityService from '../activityService'
import ConversationSettingsRepository from '../../database/repositories/conversationSettingsRepository'
import MemberService from '../memberService'
import { generateUUIDv1 } from '@crowd/common'

const db = null

const searchEngine = null

const SEARCH_ENGINE_WAIT = 500

function getConversationStyleActivity(activity) {
  // conversation documents have activity.timestamp as unix timestamps instead of date string
  activity.timestamp = moment(activity.timestamp).unix()

  // since we return parent as well now for display options, dates are casted to string in search engine
  if (activity.parent) {
    activity.parent.timestamp = activity.parent.timestamp.toISOString()
    activity.parent.createdAt = activity.parent.createdAt.toISOString()
    activity.parent.updatedAt = activity.parent.updatedAt.toISOString()
  }

  // only the username will be returned as author, rest of the member object shouldn't be expected
  activity.author = activity.username
  delete activity.member

  // parent and display won't be sent in the activity object to the search engine as well
  delete activity.display

  // search engine returns everything as string
  activity.createdAt = moment(activity.createdAt).toISOString()
  activity.updatedAt = moment(activity.updatedAt).toISOString()

  return activity
}

describe('ConversationService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
    await SearchEngineTestUtils.deleteIndexes(searchEngine)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('generateSlug method', () => {
    it('Should generate a non existent slug using the title successfully', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      const conversationService = new ConversationService(mockIServiceOptions)

      // should get rid of non standart characters, punctuations and extra whitespace
      const slug = await conversationService.generateSlug(
        '!!Hello there!... (!@#$%*/\\&[]_-=,:!?öçışüğ) This   is some   cool title   with more than ten words that should be cut off in slug',
      )

      expect(slug).toStrictEqual('hello-there-this-is-some-cool-title-with-more-than')
    })

    it('Should generate an empty string slug for an empty title', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const conversationService = new ConversationService(mockIServiceOptions)
      const slug = await conversationService.generateSlug('')
      expect(slug).toStrictEqual('')
    })

    it('Should generate suffixed slugs when generated slug already exists in a conversation of a tenant', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const conversationService = new ConversationService(mockIServiceOptions)
      await conversationService.create({
        title: 'some activity title',
        slug: 'some-activity-title',
      })

      let slug = await conversationService.generateSlug('some activity title')

      expect(slug).toStrictEqual('some-activity-title-1')

      await conversationService.create({
        title: 'some activity title',
        slug: 'some-activity-title-1',
      })

      slug = await conversationService.generateSlug('some activity title')

      expect(slug).toStrictEqual('some-activity-title-2')
    })
  })

  describe('generateTitle method', () => {
    it('Should return the same title string if an alphanumeric character exists in title', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const conversationService = new ConversationService(mockIServiceOptions)

      expect(await conversationService.generateTitle('asd!@#')).toStrictEqual('asd!@#')
    })

    it('Should return the default title if an alphanumeric character does not exist in title', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const conversationService = new ConversationService(mockIServiceOptions)

      expect(await conversationService.generateTitle('!@#')).toStrictEqual('conversation-0')
    })

    it('Should return the default title with incremented count if an alphanumeric character does not exist in title', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const conversationService = new ConversationService(mockIServiceOptions)

      // create a conversation so count becomes 1
      await conversationService.create({ slug: 'some-slug', title: 'some title' })

      expect(await conversationService.generateTitle('!@#$%^&*( ')).toStrictEqual('conversation-1')
    })

    it('Should return plain text title string if html value is passed', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const conversationService = new ConversationService(mockIServiceOptions)

      expect(
        await conversationService.generateTitle('<p>some title,<br />with a second line</p>', true),
      ).toStrictEqual('some title, with a second line')
    })
  })

  describe('sanitizeChannel method', () => {
    it('Should return the channel of a conversation - normal string', async () => {
      const cat = 'hey-how-are-you'
      expect(ConversationService.sanitizeChannel(cat)).toBe(cat)
    })

    it('Should return the channel of a conversation - string with front dashes', async () => {
      const cat = '-hey-how-are-you'
      expect(ConversationService.sanitizeChannel(cat)).toBe('hey-how-are-you')
    })

    it('Should return the channel of a conversation - string with front and trailing dashes', async () => {
      const cat = '-hey-how-are-you-'
      expect(ConversationService.sanitizeChannel(cat)).toBe('hey-how-are-you')
    })

    it('Should return the channel of a conversation - string with emoji', async () => {
      const cat = '💬chat'
      expect(ConversationService.sanitizeChannel(cat)).toBe('chat')
    })

    it('Should return the channel of a conversation - only emoji -> translate', async () => {
      const cat = '💬'
      expect(ConversationService.sanitizeChannel(cat)).toBe('speech_balloon')
    })

    it('Should return the channel of a conversation - only emoji 1+', async () => {
      const cat = '💬💥'
      expect(ConversationService.sanitizeChannel(cat)).toBe('speech_balloon-boom')
    })

    it('Should return the channel of a conversation - only emoji 1+ and symbols', async () => {
      const cat = '💬->💥'
      expect(ConversationService.sanitizeChannel(cat)).toBe('speech_balloon-boom')
    })

    it('Should return the channel of a conversation - only emoji', async () => {
      const cat = 'chat💬-and-duck🐣'
      expect(ConversationService.sanitizeChannel(cat)).toBe('chat-and-duck')
    })

    it('Should return the channel of a conversation - only emoji', async () => {
      const cat = '💬-and-duck🐣'
      expect(ConversationService.sanitizeChannel(cat)).toBe('and-duck')
    })
  })

  describe('loadIntoSearchEngine method', () => {
    it('Should create a document representation of a conversation in the search engine', async () => {
      let mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.essential,
        'a tenant name',
        '#tenantUrl',
      )
      mockIServiceOptions = await SearchEngineTestUtils.injectSearchEngine(
        searchEngine,
        mockIServiceOptions,
      )

      const conversationService = new ConversationService(mockIServiceOptions)

      const conversationSearchEngineRepository = new ConversationSearchEngineRepository(
        mockIServiceOptions,
      )

      // create a conversation
      const conversationCreated = await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
      })

      let settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      settings.website = 'https://some-website.com'

      settings = await SettingsRepository.save(settings, mockIServiceOptions)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.DISCORD]: {
              username: 'test',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIServiceOptions,
      )

      let activity1Created = await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-05-28T15:13:30Z',
          platform: PlatformType.DISCORD,
          url: 'https://parent-id-url.com',
          body: 'conversation activity 1',
          channel: 'some-channel',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId1',
        },
        mockIServiceOptions,
      )

      let activity2Created = await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-05-29T15:13:30Z',
          platform: PlatformType.DISCORD,
          body: 'conversation activity 2',
          channel: 'some-channel',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId2',
        },
        mockIServiceOptions,
      )

      let activity3Created = await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-05-30T15:13:30Z',
          platform: PlatformType.DISCORD,
          channel: 'some-channel',
          body: 'conversation activity 3',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId3',
        },
        mockIServiceOptions,
      )

      // Delete because we only care about 1st level relations
      delete activity1Created.tasks
      delete activity2Created.tasks
      delete activity3Created.tasks

      let transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)

      await conversationService.loadIntoSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })
      // now try getting the document from search engine
      let conversationDocument = await conversationSearchEngineRepository.findById(
        conversationCreated.id,
      )

      activity1Created = getConversationStyleActivity(activity1Created)
      activity2Created = getConversationStyleActivity(activity2Created)
      activity3Created = getConversationStyleActivity(activity3Created)

      // first activity should be marked as conversationStarter:true because activities are sorted ascending by timestamp
      activity1Created.conversationStarter = true

      let expectedConversationDocument = {
        id: conversationCreated.id,
        tenantSlug: mockIServiceOptions.currentTenant.url,
        title: conversationCreated.title,
        slug: conversationCreated.slug,
        activities: [activity1Created, activity2Created, activity3Created],
        platform: activity1Created.platform,
        activitiesBodies: [activity1Created.body, activity2Created.body, activity3Created.body],
        channel: activity1Created.channel,
        lastActive: activity3Created.timestamp,
        views: 0,
        url: activity1Created.url,
      }

      expect(conversationDocument).toStrictEqual(expectedConversationDocument)

      // add a new activity to the conversation and re-load to search engine
      let activity4Created = await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-06-01T15:13:30Z',
          platform: PlatformType.DISCORD,
          body: 'conversation activity 4',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId4',
        },
        mockIServiceOptions,
      )

      transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)

      await conversationService.loadIntoSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      conversationDocument = await conversationSearchEngineRepository.findById(
        conversationCreated.id,
      )

      activity4Created = getConversationStyleActivity(activity4Created)

      // Delete because we only care about 1st level relations
      delete activity4Created.tasks

      // activity information and lastActive should be changed
      expectedConversationDocument = {
        id: conversationCreated.id,
        tenantSlug: mockIServiceOptions.currentTenant.url,
        title: conversationCreated.title,
        slug: conversationCreated.slug,
        activities: [activity1Created, activity2Created, activity3Created, activity4Created],
        platform: activity1Created.platform,
        activitiesBodies: [
          activity1Created.body,
          activity2Created.body,
          activity3Created.body,
          activity4Created.body,
        ],
        channel: activity1Created.channel,
        lastActive: activity4Created.timestamp,
        views: 0,
        url: activity1Created.url,
      }

      expect(conversationDocument).toStrictEqual(expectedConversationDocument)

      // a new activity with empty body but with attachment should be still loaded to the search engine
      let activity5Created = await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-06-02T15:13:30Z',
          platform: PlatformType.DISCORD,
          body: '',
          attributes: {
            attachments: [
              {
                id: '970587696546324510',
                url: 'https://cdn.discordapp.com/attachments/968085326893568053/970587696546324510/letsgooo.png',
                fileName: 'letsgooo.png',
                createdAt: 1651476539504,
                mediaType: 'image/png',
              },
            ],
          },
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId6',
        },
        mockIServiceOptions,
      )

      transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)

      await conversationService.loadIntoSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      conversationDocument = await conversationSearchEngineRepository.findById(
        conversationCreated.id,
      )

      activity5Created = getConversationStyleActivity(activity5Created)

      delete activity1Created.tasks
      delete activity2Created.tasks
      delete activity3Created.tasks
      delete activity4Created.tasks
      delete activity5Created.tasks

      // activity information and lastActive should be changed
      expectedConversationDocument = {
        id: conversationCreated.id,
        tenantSlug: mockIServiceOptions.currentTenant.url,
        title: conversationCreated.title,
        slug: conversationCreated.slug,
        activities: [
          activity1Created,
          activity2Created,
          activity3Created,
          activity4Created,
          activity5Created,
        ],
        platform: activity1Created.platform,
        activitiesBodies: [
          activity1Created.body,
          activity2Created.body,
          activity3Created.body,
          activity4Created.body,
          activity5Created.body,
        ],
        lastActive: activity5Created.timestamp,
        views: 0,
        channel: activity1Created.channel,
        url: activity1Created.url,
      }

      expect(conversationDocument).toStrictEqual(expectedConversationDocument)

      // a new activity with empty body and no attachment should not be loaded to the search engine
      await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-06-03T15:13:30Z',
          platform: PlatformType.DISCORD,
          attributes: {
            attachments: [],
          },
          body: '',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId7',
        },
        mockIServiceOptions,
      )

      transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)

      await conversationService.loadIntoSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      conversationDocument = await conversationSearchEngineRepository.findById(
        conversationCreated.id,
      )

      // loaded document should be same as previously loaded one (activity6 shouldn't exist)
      expect(conversationDocument).toStrictEqual(expectedConversationDocument)
    })

    it('Should create a document representation of a conversation in the search engine when auto-publishing', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      mockIRepositoryOptions = await SearchEngineTestUtils.injectSearchEngine(
        searchEngine,
        mockIRepositoryOptions,
      )
      const conversationSearchEngineRepository = new ConversationSearchEngineRepository(
        mockIRepositoryOptions,
      )
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
          [PlatformType.GITHUB]: {
            username: 'test',
            integrationId: generateUUIDv1(),
          },
        },
        displayName: 'Member 1',
        platform: PlatformType.GITHUB,
        joinedAt: '2020-05-27T15:13:30Z',
      })

      const activityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: PlatformType.GITHUB,
        attributes: {
          replies: 12,
        },
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
        attributes: {
          replies: 12,
        },
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

      // Delete because we only care about 1st level relations
      delete activityParentCreated.tasks
      delete activityChildCreated.tasks

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
          filter: {
            slug: 'some-parent-activity',
          },
        })
      ).rows[0]

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      activityParentCreated = getConversationStyleActivity(
        await ActivityRepository.findById(activityParentCreated.id, mockIRepositoryOptions),
      )
      activityChildCreated = getConversationStyleActivity(
        await ActivityRepository.findById(activityChildCreated.id, mockIRepositoryOptions),
      )

      // first activity should be marked as conversationStarter:true because activities are sorted ascending by timestamp
      activityParentCreated.conversationStarter = true

      const conversationDocument = await conversationSearchEngineRepository.findById(
        conversationCreated.id,
      )

      delete activityParentCreated.tasks
      delete activityChildCreated.tasks

      const expectedConversationDocument = {
        id: conversationCreated.id,
        tenantSlug: mockIRepositoryOptions.currentTenant.url,
        title: conversationCreated.title,
        slug: conversationCreated.slug,
        activities: [activityParentCreated, activityChildCreated],
        platform: activityParentCreated.platform,
        activitiesBodies: [activityParentCreated.body, activityChildCreated.body],
        channel: 'crowd-web',
        url: null,
        lastActive: activityChildCreated.timestamp,
        views: 0,
      }

      expect(conversationCreated.published).toStrictEqual(true)
      expect(conversationDocument).toStrictEqual(expectedConversationDocument)
    })
  })

  describe('removeFromSearchEngine method', () => {
    it('Should remove a conversation document from the search engine', async () => {
      let mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.essential,
        'a tenant name',
        '#tenantUrl',
      )
      mockIServiceOptions = await SearchEngineTestUtils.injectSearchEngine(
        searchEngine,
        mockIServiceOptions,
      )

      const conversationService = new ConversationService(mockIServiceOptions)

      const conversationSearchEngineRepository = new ConversationSearchEngineRepository(
        mockIServiceOptions,
      )

      // create a conversation
      const conversationCreated = await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
      })

      // create an integration
      await IntegrationRepository.create(
        {
          status: 'done',
          platform: PlatformType.DISCORD,
          settings: {
            inviteLink: 'https://some-invite-link.com',
          },
        },
        mockIServiceOptions,
      )

      let settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      settings.website = 'https://some-website.com'

      settings = await SettingsRepository.save(settings, mockIServiceOptions)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.DISCORD]: {
              username: 'test',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIServiceOptions,
      )

      await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-05-28T15:13:30Z',
          platform: PlatformType.DISCORD,
          channel: 'some-channel',
          body: 'conversation activity 1',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId1',
        },
        mockIServiceOptions,
      )

      // create a conversation document in the search engine
      let transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)

      // add same documents with different ids
      await conversationService.loadIntoSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      // now try removing it
      transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)

      await conversationService.removeFromSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      // getting non existing document should return null

      let findById = await conversationSearchEngineRepository.findById(conversationCreated.id)

      expect(findById).toBeNull()

      transaction = await SequelizeRepository.createTransaction(mockIServiceOptions)
      // trying to remove a non existing document shouldn't throw an error
      await conversationService.removeFromSearchEngine(conversationCreated.id, transaction)

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      findById = await conversationSearchEngineRepository.findById(conversationCreated.id)
      expect(findById).toBeNull()
    })
  })

  describe('update method', () => {
    it('Should publish/unpublish a conversation to search engine when published=true/false is sent', async () => {
      let mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.essential,
        'a tenant name',
        '#tenantUrl',
      )
      mockIServiceOptions = await SearchEngineTestUtils.injectSearchEngine(
        searchEngine,
        mockIServiceOptions,
      )

      const conversationService = new ConversationService(mockIServiceOptions)

      const conversationSearchEngineRepository = new ConversationSearchEngineRepository(
        mockIServiceOptions,
      )

      // create a conversation
      const conversationCreated = await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
      })

      let settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      settings.website = 'https://some-website.com'

      settings = await SettingsRepository.save(settings, mockIServiceOptions)

      const memberCreated = await MemberRepository.create(
        {
          username: {
            [PlatformType.DISCORD]: {
              username: 'test',
              integrationId: generateUUIDv1(),
            },
          },
          displayName: 'Member 1',
          joinedAt: '2020-05-27T15:13:30Z',
        },
        mockIServiceOptions,
      )

      let activity1Created = await ActivityRepository.create(
        {
          type: 'message',
          timestamp: '2020-05-28T15:13:30Z',
          platform: PlatformType.DISCORD,
          url: 'https://parent-act-url.com',
          body: 'conversation activity 1',
          channel: 'some-channel',
          isContribution: true,
          username: 'test',
          member: memberCreated.id,
          score: 1,
          conversationId: conversationCreated.id,
          sourceId: '#sourceId1',
        },
        mockIServiceOptions,
      )

      // update the conversation
      await conversationService.update(conversationCreated.id, { published: true })

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      activity1Created = getConversationStyleActivity(activity1Created)
      activity1Created.conversationStarter = true

      // Delete because we only care about 1st level relations
      delete activity1Created.tasks

      // also delete display while expecting
      delete activity1Created.display

      const expectedConversationDocument = {
        id: conversationCreated.id,
        tenantSlug: mockIServiceOptions.currentTenant.url,
        title: conversationCreated.title,
        slug: conversationCreated.slug,
        activities: [activity1Created],
        platform: activity1Created.platform,
        activitiesBodies: [activity1Created.body],
        lastActive: activity1Created.timestamp,
        views: 0,
        url: activity1Created.url,
        channel: activity1Created.channel,
      }

      // check search engine
      let doc = await conversationSearchEngineRepository.findById(conversationCreated.id)

      expect(doc).toStrictEqual(expectedConversationDocument)

      // send published = false
      await conversationService.update(conversationCreated.id, { published: false })

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      doc = await conversationSearchEngineRepository.findById(conversationCreated.id)

      expect(doc).toBeNull()

      // multiple updates to published=false shouldn't throw an error
      await conversationService.update(conversationCreated.id, { published: false })

      doc = await conversationSearchEngineRepository.findById(conversationCreated.id)

      expect(doc).toBeNull()
    })
  })
  describe('updateSettings method', () => {
    it('Should update settings in various entities and push these settings to search engine', async () => {
      let mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.essential,
        'a tenant name',
        '#tenantUrl',
      )
      mockIServiceOptions = await SearchEngineTestUtils.injectSearchEngine(
        searchEngine,
        mockIServiceOptions,
      )

      const conversationService = new ConversationService(mockIServiceOptions)

      const settingsSearchEngineRepository = new SettingsSearchEngineRepository(mockIServiceOptions)

      // create an integration
      let integration1Created = await IntegrationRepository.create(
        {
          status: 'done',
          platform: PlatformType.DISCORD,
        },
        mockIServiceOptions,
      )

      let integration2Created = await IntegrationRepository.create(
        {
          status: 'done',
          platform: PlatformType.SLACK,
        },
        mockIServiceOptions,
      )

      let integration3Created = await IntegrationRepository.create(
        {
          status: 'done',
          platform: PlatformType.GITHUB,
        },
        mockIServiceOptions,
      )

      let settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      const updateSettings = {
        website: 'some-website-link',
        tenant: {
          url: 'a-brand-new-tenant-slug',
          name: 'a cool new tenant name',
        },
        inviteLinks: {
          [PlatformType.GITHUB]: 'a-github-invite-link',
          [PlatformType.DISCORD]: 'a-discord-invite-link',
          [PlatformType.SLACK]: 'a-slack-invite-link',
        },
      }

      await conversationService.updateSettings(updateSettings)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      // check integration entities
      integration1Created = await IntegrationRepository.findById(
        integration1Created.id,
        mockIServiceOptions,
      )
      integration2Created = await IntegrationRepository.findById(
        integration2Created.id,
        mockIServiceOptions,
      )
      integration3Created = await IntegrationRepository.findById(
        integration3Created.id,
        mockIServiceOptions,
      )

      expect(integration1Created.settings.inviteLink).toStrictEqual(
        updateSettings.inviteLinks.discord,
      )
      expect(integration2Created.settings.inviteLink).toStrictEqual(
        updateSettings.inviteLinks.slack,
      )
      expect(integration3Created.settings.inviteLink).toStrictEqual(
        updateSettings.inviteLinks.github,
      )

      // check tenant name & slug
      let tenant = (
        await TenantRepository.findById(mockIServiceOptions.currentTenant.id, mockIServiceOptions)
      ).get({ plain: true })

      expect(tenant.name).toStrictEqual(updateSettings.tenant.name)
      expect(tenant.url).toStrictEqual(updateSettings.tenant.url)

      // check settings.website
      settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      expect(settings.website).toStrictEqual(updateSettings.website)

      // check search engine
      let doc = await settingsSearchEngineRepository.findById(mockIServiceOptions.currentTenant.id)

      let expectedSettingsDocuments = {
        id: mockIServiceOptions.currentTenant.id,
        tenantName: updateSettings.tenant.name,
        tenantSlug: updateSettings.tenant.url,
        enabled: false,
        inviteLinks: {
          [PlatformType.DISCORD]: updateSettings.inviteLinks.discord,
          [PlatformType.SLACK]: updateSettings.inviteLinks.slack,
          [PlatformType.GITHUB]: updateSettings.inviteLinks.github,
        },
        website: updateSettings.website,
      }

      expect(doc).toStrictEqual(expectedSettingsDocuments)

      // create a published tenant
      await conversationService.create({
        slug: 'some-slug',
        title: 'some title',
        published: true,
      })

      const published = await conversationService.findAndCountAll({ filter: { published: true } })
      expect(published.count).toStrictEqual(1)

      const updateSettingsNewSlug = {
        website: 'some-website-link',
        tenant: {
          url: 'a-brand-new-tenant-slug2',
          name: 'a cool new tenant name',
        },
        inviteLinks: {
          [PlatformType.GITHUB]: 'a-github-invite-link',
          [PlatformType.DISCORD]: 'a-discord-invite-link',
          [PlatformType.SLACK]: 'a-slack-invite-link',
        },
      }

      // updating tenantSlug should throw error when tenant has published conversations
      await expect(() =>
        conversationService.updateSettings(updateSettingsNewSlug),
      ).rejects.toThrowError(
        new Error400(mockIServiceOptions.language, 'tenant.errors.publishedConversationExists'),
      )

      // rest of the settings should be still updateable
      const updateSettings2 = {
        website: 'some-website-link-2',
        tenant: {
          name: 'a cool new tenant name 2',
        },
        inviteLinks: {
          [PlatformType.GITHUB]: 'a-github-invite-link-2',
          [PlatformType.DISCORD]: 'a-discord-invite-link-2',
          [PlatformType.SLACK]: 'a-slack-invite-link-2',
        },
      }

      await conversationService.updateSettings(updateSettings2)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      // check integration entities
      integration1Created = await IntegrationRepository.findById(
        integration1Created.id,
        mockIServiceOptions,
      )
      integration2Created = await IntegrationRepository.findById(
        integration2Created.id,
        mockIServiceOptions,
      )
      integration3Created = await IntegrationRepository.findById(
        integration3Created.id,
        mockIServiceOptions,
      )

      expect(integration1Created.settings.inviteLink).toStrictEqual(
        updateSettings2.inviteLinks.discord,
      )
      expect(integration2Created.settings.inviteLink).toStrictEqual(
        updateSettings2.inviteLinks.slack,
      )
      expect(integration3Created.settings.inviteLink).toStrictEqual(
        updateSettings2.inviteLinks.github,
      )

      // check tenant name & slug
      tenant = (
        await TenantRepository.findById(mockIServiceOptions.currentTenant.id, mockIServiceOptions)
      ).get({ plain: true })

      expect(tenant.name).toStrictEqual(updateSettings2.tenant.name)

      // should still be old slug set
      expect(tenant.url).toStrictEqual(updateSettings.tenant.url)

      // check settings.website
      settings = await SettingsRepository.findOrCreateDefault({}, mockIServiceOptions)

      expect(settings.website).toStrictEqual(updateSettings2.website)

      // check search engine
      doc = await settingsSearchEngineRepository.findById(mockIServiceOptions.currentTenant.id)

      expectedSettingsDocuments = {
        id: mockIServiceOptions.currentTenant.id,
        tenantName: updateSettings2.tenant.name,
        enabled: false,
        tenantSlug: updateSettings.tenant.url,
        inviteLinks: {
          [PlatformType.DISCORD]: updateSettings2.inviteLinks.discord,
          [PlatformType.SLACK]: updateSettings2.inviteLinks.slack,
          [PlatformType.GITHUB]: updateSettings2.inviteLinks.github,
        },
        website: updateSettings2.website,
      }

      expect(doc).toStrictEqual(expectedSettingsDocuments)
    })
    it('Should update settings.autoPublish and publish past conversations if custom rules are matched', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      mockIRepositoryOptions = await SearchEngineTestUtils.injectSearchEngine(
        searchEngine,
        mockIRepositoryOptions,
      )
      const conversationSearchEngineRepository = new ConversationSearchEngineRepository(
        mockIRepositoryOptions,
      )
      const activityService = new ActivityService(mockIRepositoryOptions)
      await SettingsRepository.findOrCreateDefault(
        { website: 'https://some-website' },
        mockIRepositoryOptions,
      )
      await ConversationSettingsRepository.findOrCreateDefault({}, mockIRepositoryOptions)

      const memberCreated = await new MemberService(mockIRepositoryOptions).upsert({
        username: {
          [PlatformType.GITHUB]: {
            username: 'test',
            integrationId: generateUUIDv1(),
          },
          [PlatformType.DISCORD]: {
            username: 'test',
            integrationId: generateUUIDv1(),
          },
        },
        platform: 'github',
        joinedAt: '2020-05-27T10:13:30Z',
      })

      const githubActivityParent = {
        type: 'activity',
        timestamp: '2020-05-27T10:13:30Z',
        platform: 'github',
        body: 'Some Github Parent Activity',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#githubSourceId1',
      }

      let githubActivityParentCreated = await ActivityRepository.create(
        githubActivityParent,
        mockIRepositoryOptions,
      )

      const githubActivityChild = {
        type: 'activity',
        timestamp: '2020-05-27T11:13:30Z',
        platform: 'github',
        body: 'Here',
        channel: 'https://github.com/CrowdDevHQ/crowd-web',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: githubActivityParentCreated.id,
        sourceId: '#githubSourceId2',
      }

      let githubActivityChildCreated = await ActivityRepository.create(
        githubActivityChild,
        mockIRepositoryOptions,
      )

      let transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await activityService.addToConversation(
        githubActivityChildCreated.id,
        githubActivityParentCreated.id,
        transaction,
      )

      const discordActivityParent = {
        type: 'activity',
        timestamp: '2020-05-27T14:13:30Z',
        platform: 'discord',
        body: 'Some Discord Parent Activity',
        channel: 'channel',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        sourceId: '#discordSourceId1',
      }

      const discordActivityParentCreated = await ActivityRepository.create(
        discordActivityParent,
        mockIRepositoryOptions,
      )

      const discordActivityChild = {
        type: 'activity',
        timestamp: '2020-05-27T15:13:30Z',
        platform: 'discord',
        body: 'Here',
        channel: 'channel',
        isContribution: true,
        username: 'test',
        member: memberCreated.id,
        score: 1,
        parent: discordActivityParentCreated.id,
        sourceId: '#discordSourceId2',
      }

      const discordActivityChildCreated = await ActivityRepository.create(
        discordActivityChild,
        mockIRepositoryOptions,
      )

      await activityService.addToConversation(
        discordActivityChildCreated.id,
        discordActivityParentCreated.id,
        transaction,
      )
      await SequelizeRepository.commitTransaction(transaction)

      transaction = await SequelizeRepository.createTransaction(mockIRepositoryOptions)

      await new ConversationService(mockIRepositoryOptions).updateSettings({
        autoPublish: {
          status: 'custom',
          channelsByPlatform: {
            [PlatformType.GITHUB]: ['CrowdDevHQ/crowd-web'],
          },
        },
      })

      await SequelizeRepository.commitTransaction(transaction)

      await new Promise((resolve) => {
        setTimeout(resolve, SEARCH_ENGINE_WAIT)
      })

      const githubConversationCreated = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          filter: {
            slug: 'some-github-parent-activity',
            platform: 'github',
          },
        })
      ).rows[0]

      const discordConversationCreated = (
        await new ConversationService(mockIRepositoryOptions).findAndCountAll({
          filter: {
            slug: 'some-discord-parent-activity',
            platform: 'discord',
          },
        })
      ).rows[0]

      githubActivityParentCreated = getConversationStyleActivity(
        await ActivityRepository.findById(githubActivityParentCreated.id, mockIRepositoryOptions),
      )
      githubActivityChildCreated = getConversationStyleActivity(
        await ActivityRepository.findById(githubActivityChildCreated.id, mockIRepositoryOptions),
      )

      // first activity should be marked as conversationStarter:true because activities are sorted ascending by timestamp
      githubActivityParentCreated.conversationStarter = true

      // We only care about 1st order relations
      delete githubActivityParentCreated.tasks
      delete githubActivityChildCreated.tasks
      delete githubActivityParentCreated.display
      delete githubActivityChildCreated.display

      const conversationDocument = await conversationSearchEngineRepository.findById(
        githubConversationCreated.id,
      )

      const expectedConversationDocument = {
        id: githubConversationCreated.id,
        tenantSlug: mockIRepositoryOptions.currentTenant.url,
        title: githubConversationCreated.title,
        slug: githubConversationCreated.slug,
        activities: [githubActivityParentCreated, githubActivityChildCreated],
        platform: githubActivityParentCreated.platform,
        url: null,
        activitiesBodies: [githubActivityParentCreated.body, githubActivityChildCreated.body],
        channel: 'crowd-web',
        lastActive: githubActivityChildCreated.timestamp,
        views: 0,
      }

      expect(githubConversationCreated.published).toStrictEqual(true)
      expect(discordConversationCreated.published).toStrictEqual(false)
      expect(conversationDocument).toStrictEqual(expectedConversationDocument)
    })
  })
})
