import MemberService from '../../../../services/memberService'
import SequelizeTestUtils from '../../../../database/utils/sequelizeTestUtils'
import TwitterReachIterator from '../twitterReachIterator'
import { PlatformType } from '../../../../types/integrationEnums'

const db = null

async function init(members) {
  const tenantId = (await SequelizeTestUtils.getTestIServiceOptions(db)).currentTenant.get({
    plain: true,
  })
  return {
    tenantId,
    iter: new TwitterReachIterator(tenantId, 'profileId', 'accessToken', members),
  }
}

describe('Twitter iterator tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  async function addMembers(members, mockIServiceOptions) {
    const memberService = new MemberService(mockIServiceOptions)
    for (const member of members) {
      await memberService.upsert({
        username: member.username,
        platform: member.platform || PlatformType.TWITTER,
      })
    }
  }

  describe('Find members tests', () => {
    it('It should find Twitter members when they exist', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      await addMembers([{ username: 'gilfoyle' }, { username: 'dinesh' }], mockIServiceOptions)
      const found = await TwitterReachIterator.getMembers(mockIServiceOptions)
      const usernamesFound = found.map((m) => m.username)
      expect(usernamesFound.sort()).toStrictEqual(['gilfoyle', 'dinesh'].sort())
      expect(found[0].id).toBeDefined()
    })

    it('It should only find Twitter members', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      await addMembers(
        [
          { username: 'gilfoyle' },
          { username: 'dinesh' },
          { username: 'richard', platform: PlatformType.GITHUB },
        ],
        mockIServiceOptions,
      )
      const found = await TwitterReachIterator.getMembers(mockIServiceOptions)
      const usernamesFound = found.map((m) => m.username)
      expect(usernamesFound.sort()).toStrictEqual(['gilfoyle', 'dinesh'].sort())
      expect(found[0].id).toBeDefined()
    })

    it('It should return an empty list if no Twitter members', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      await addMembers(
        [
          { username: 'gilfoyle', platform: PlatformType.GITHUB },
          { username: 'dinesh', platform: PlatformType.GITHUB },
        ],
        mockIServiceOptions,
      )
      const found = await TwitterReachIterator.getMembers(mockIServiceOptions)
      expect(found.sort()).toStrictEqual([].sort())
    })
  })

  describe('Wrap array tests', () => {
    it('It should wrap lists and stringify them', async () => {
      const arr = Array(99 * 3).fill('m')
      const wrapped = TwitterReachIterator.wrapToEndpoints(arr)
      expect(wrapped.length).toBe(3)
      for (const chunk of wrapped) {
        expect(JSON.parse(chunk).length).toBe(99)
      }
    })
    it('It should wrap lists that do not match the length exactly', async () => {
      const arr = Array(99 * 2 + 10).fill('m')
      const wrapped = TwitterReachIterator.wrapToEndpoints(arr)
      expect(wrapped.length).toBe(3)
      expect(JSON.parse(wrapped[0]).length).toBe(99)
      expect(JSON.parse(wrapped[1]).length).toBe(99)
      expect(JSON.parse(wrapped[2]).length).toBe(10)
    })

    it('It should return an empty array for empty inputs', async () => {
      const wrapped = TwitterReachIterator.wrapToEndpoints([])
      expect(wrapped).toStrictEqual([])
    })
  })

  describe('Parsing tests', () => {
    it('It should get reach for a member', async () => {
      const members = [
        {
          username: 'gilfoyle',
          id: '123',
          reach: { total: -1 },
        },
      ]
      const { iter } = await init(members)
      const out = iter.parseReach(
        [{ followersCount: 10, username: 'gilfoyle' }],
        JSON.stringify(members),
      )
      const expected = [
        {
          id: '123',
          update: {
            reach: {
              [PlatformType.TWITTER]: 10,
              total: 10,
            },
          },
        },
      ]
      expect(out).toStrictEqual(expected)
    })
  })
  it('It should only get updates for members that changed followers', async () => {
    const members = [
      {
        username: 'gilfoyle',
        id: '123',
        reach: { total: -1 },
      },
      {
        username: 'dinesh',
        id: '456',
        reach: { total: 20, [PlatformType.TWITTER]: 20 },
      },
    ]
    const { iter } = await init(members)
    const out = iter.parseReach(
      [
        { followersCount: 10, username: 'gilfoyle' },
        { followersCount: 20, username: 'dinesh' },
      ],
      JSON.stringify(members),
    )
    const expected = [
      {
        id: '123',
        update: {
          reach: {
            [PlatformType.TWITTER]: 10,
            total: 10,
          },
        },
      },
    ]
    expect(out).toStrictEqual(expected)
  })
})
