import SequelizeTestUtils from '../../../../database/utils/sequelizeTestUtils'
import IntegrationService from '../../../../services/integrationService'
import { PlatformType } from '../../../../utils/platforms'
import DevtoIterator from '../devtoIterator'
import { DevtoArticle, DevtoComment } from '../../usecases/devto/types'
import { DevtoGrid } from '../../grid/devtoGrid'
import { AddActivitiesSingle } from '../../types/messageTypes'
import { MemberAttributeName } from '../../../../database/attributes/member/enums'

const db = null

function fakeArticle(id: number): DevtoArticle {
  return {
    id,
    title: `Fake Article #${id}`,
    description: `Fake Article #${id} Description`,
    cover_image: `https://fakeimg.pl/350x200/?text=FakeArticle${id}`,
    social_image: `https://fakeimg.pl/350x200/?text=FakeArticle${id}`,
    readable_publish_date: 'Today',
    tag_list: [],
    slug: `fake_article_${id}`,
    url: `https://dev.to/article/${id}`,
    comments_count: 0,
    published_at: new Date().toISOString(),
    last_comment_at: new Date().toISOString(),
  }
}

function fakeComment(id: string, children: DevtoComment[] = []): DevtoComment {
  return {
    id_code: id,
    created_at: new Date().toISOString(),
    body_html: 'Hello world!',
    user: {
      user_id: 123,
      name: 'John',
      username: 'johndoe',
      twitter_username: 'johntwitter',
      github_username: 'johngithub',
      website_url: 'https://john.com',
      profile_image: 'https://fakeimg.pl/350x200/?text=JohnDoe',
      profile_image_90: 'https://fakeimg.pl/90x60/?text=JohnDoe',
    },
    fullUser: {
      id: 123,
      name: 'John',
      username: 'johndoe',
      twitter_username: 'johntwitter',
      github_username: 'johngithub',
      website_url: 'https://john.com',
      profile_image: 'https://fakeimg.pl/350x200/?text=JohnDoe',
      summary: 'Nice profile you got there',
      location: 'Venice, Italy',
      joined_at: new Date().toISOString(),
    },
    children,
  }
}

async function getDevtoIterator(articles: DevtoArticle[]) {
  const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
  const tenantId = mockIRepositoryOptions.currentTenant.id
  const integrationService = new IntegrationService(mockIRepositoryOptions)
  const integrationId = (
    await integrationService.createOrUpdate({
      platform: PlatformType.DEVTO,
      token: 'token',
      settings: {},
    })
  ).id

  return new DevtoIterator(
    tenantId,
    articles,
    mockIRepositoryOptions,
    integrationId,
    {
      endpoint: '',
      page: '',
    },
    false,
  )
}

describe('Dev.to iterator tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(() => {
    SequelizeTestUtils.closeConnection(db)
  })

  describe('Init tests', () => {
    it('It should initialize endpoints and articles properly', async () => {
      const articles: DevtoArticle[] = [fakeArticle(1), fakeArticle(2), fakeArticle(3)]
      const iter = await getDevtoIterator(articles)
      expect(iter.endpoints).toEqual(['1', '2', '3'])
      expect(iter.articles).toEqual(articles)
    })
  })

  describe('Parse comments tests', () => {
    it('It should parse comment without children and parent', async () => {
      const article = fakeArticle(1)
      const iter = await getDevtoIterator([article])

      const commentCreatedDate = new Date()
      const activities = iter.parseComment(1, {
        id_code: '123',
        created_at: commentCreatedDate.toISOString(),
        body_html: 'Hello world!',
        user: {
          user_id: 123,
          name: 'John',
          username: 'johndoe',
          twitter_username: 'johntwitter',
          github_username: 'johngithub',
          website_url: 'https://john.com',
          profile_image: 'https://fakeimg.pl/350x200/?text=JohnDoe',
          profile_image_90: 'https://fakeimg.pl/90x60/?text=JohnDoe',
        },
        fullUser: {
          id: 123,
          name: 'John',
          username: 'johndoe',
          twitter_username: 'johntwitter',
          github_username: 'johngithub',
          website_url: 'https://john.com',
          profile_image: 'https://fakeimg.pl/350x200/?text=JohnDoe',
          summary: 'Nice profile you got there',
          location: 'Venice, Italy',
          joined_at: new Date().toISOString(),
        },
        children: [],
      })

      expect(activities.length).toEqual(1)
      const activity = activities[0]
      expect(activity.platform).toEqual(PlatformType.DEVTO)
      expect(activity.type).toEqual('comment')
      expect(activity.timestamp).toEqual(commentCreatedDate)
      expect(activity.sourceId).toEqual('123')
      expect(activity.sourceParentId).not.toBeDefined()
      expect(activity.score).toEqual(DevtoGrid.comment.score)
      expect(activity.isKeyAction).toEqual(DevtoGrid.comment.isKeyAction)
      expect(activity.body).toEqual('Hello world!')
      expect(activity.url).toEqual('https://dev.to/johndoe/comment/123')

      const activityAttributes = activity.attributes as any
      expect(activityAttributes.userUrl).toEqual('https://dev.to/johndoe')
      expect(activityAttributes.articleUrl).toEqual(article.url)

      const member = activity.member
      expect(member.username[PlatformType.DEVTO]).toEqual('johndoe')
      expect(member.attributes[PlatformType.DEVTO][MemberAttributeName.BIO]).toEqual('Nice profile you got there')
      expect(member.attributes[PlatformType.DEVTO][MemberAttributeName.LOCATION]).toEqual('Venice, Italy')
      expect(member.attributes[PlatformType.TWITTER][MemberAttributeName.URL]).toEqual('https://twitter.com/johntwitter')
      expect(member.username[PlatformType.TWITTER]).toEqual('johntwitter')
      expect(member.attributes[PlatformType.GITHUB][MemberAttributeName.NAME]).toEqual('John')
      expect(member.attributes[PlatformType.GITHUB][MemberAttributeName.URL]).toEqual('https://github.com/johngithub')
      expect(member.username[PlatformType.GITHUB]).toEqual('johngithub')
    })

    it('It should parse comment with parent and without children', async () => {
      const article = fakeArticle(1)
      const iter = await getDevtoIterator([article])

      const activities = iter.parseComment(1, fakeComment('123'), '1234')

      expect(activities.length).toEqual(1)
      const activity = activities[0]
      expect(activity.sourceId).toEqual('123')
      expect(activity.sourceParentId).toEqual('1234')
    })

    it('It should parse comment with children', async () => {
      const article = fakeArticle(1)
      const iter = await getDevtoIterator([article])

      const activities = iter.parseComment(
        1,
        fakeComment('1', [
          fakeComment('2', [fakeComment('3')]),
          fakeComment('4', [fakeComment('5', [fakeComment('6')])]),
        ]),
      )

      expect(activities.length).toEqual(6)

      const findActivity = (sourceId: string, parentId?: string): AddActivitiesSingle | undefined =>
        activities.find((a) => a.sourceId === sourceId && a.sourceParentId === parentId)

      expect(findActivity('1')).toBeDefined()
      expect(findActivity('2', '1')).toBeDefined()
      expect(findActivity('3', '2')).toBeDefined()
      expect(findActivity('4', '1')).toBeDefined()
      expect(findActivity('5', '4')).toBeDefined()
      expect(findActivity('6', '5')).toBeDefined()
    })
  })
})
