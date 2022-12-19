import moment from 'moment'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import TenantService from '../tenantService'
import MemberService from '../memberService'
import { IServiceOptions } from '../IServiceOptions'
import MicroserviceService from '../microserviceService'
import { PlatformType } from '../../types/integrationEnums'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import { MemberAttributeName } from '../../database/attributes/member/enums'
import TaskService from '../taskService'
import Plans from '../../security/plans'

const db = null

describe('TenantService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('findMembersToMerge', () => {
    it('Should show the same merge suggestion once, with reverse order', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const memberService = new MemberService(mockIServiceOptions)
      const tenantService = new TenantService(mockIServiceOptions)

      const memberToCreate1 = {
        username: 'member 1',
        platform: PlatformType.SLACK,
        email: 'member.1@email.com',
        joinedAt: '2020-05-27T15:13:30Z',
      }

      const memberToCreate2 = {
        username: 'member 2',
        platform: PlatformType.DISCORD,
        email: 'member.2@email.com',
        joinedAt: '2020-05-26T15:13:30Z',
      }

      const memberToCreate3 = {
        username: 'member 3',
        platform: PlatformType.GITHUB,
        email: 'member.3@email.com',
        joinedAt: '2020-05-25T15:13:30Z',
      }

      const memberToCreate4 = {
        username: 'member 4',
        platform: PlatformType.TWITTER,
        email: 'member.4@email.com',
        joinedAt: '2020-05-24T15:13:30Z',
      }

      const member1 = await memberService.upsert(memberToCreate1)
      let member2 = await memberService.upsert(memberToCreate2)
      const member3 = await memberService.upsert(memberToCreate3)
      let member4 = await memberService.upsert(memberToCreate4)

      await memberService.addToMerge(member1.id, member2.id)
      await memberService.addToMerge(member3.id, member4.id)

      member2 = await memberService.findById(member2.id)
      member4 = await memberService.findById(member4.id)

      expect(member2.toMerge).toHaveLength(1)
      expect(member4.toMerge).toHaveLength(1)

      const memberToMergeSuggestions = await tenantService.findMembersToMerge({})

      // In the DB there should be:
      // - Member 1 should have member 2 in toMerge
      // - Member 3 should have member 4 in toMerge
      // - Member 4 should have member 3 in toMerge
      // - We should get these 4 combinations
      // But this function should not return duplicates, so we should get
      // only two pairs: [m2, m1] and [m4, m3]

      expect(memberToMergeSuggestions.count).toEqual(2)

      expect(
        memberToMergeSuggestions.rows[0]
          .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
          .map((m) => m.id),
      ).toStrictEqual([member1.id, member2.id])

      expect(
        memberToMergeSuggestions.rows[1]
          .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
          .map((m) => m.id),
      ).toStrictEqual([member3.id, member4.id])
    })
  })

  describe('_findAndCountAllForEveryUser method', () => {
    it('Should succesfully find all tenants without filtering by currentUser', async () => {
      let tenants = await TenantService._findAndCountAllForEveryUser({ filter: {} })

      expect(tenants.count).toEqual(0)
      expect(tenants.rows).toEqual([])

      // generate 3 tenants
      const mockIServiceOptions1 = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mockIServiceOptions2 = await SequelizeTestUtils.getTestIServiceOptions(db)
      const mockIServiceOptions3 = await SequelizeTestUtils.getTestIServiceOptions(db)

      tenants = await TenantService._findAndCountAllForEveryUser({ filter: {} })

      expect(tenants.count).toEqual(3)
      expect(tenants.rows.map((i) => i.id).sort()).toEqual(
        [
          mockIServiceOptions1.currentTenant.id,
          mockIServiceOptions2.currentTenant.id,
          mockIServiceOptions3.currentTenant.id,
        ].sort(),
      )
    })
  })

  describe('create method', () => {
    it('Should succesfully create the tenant, related default microservices, settings and suggested tasks', async () => {
      const randomUser = await SequelizeTestUtils.getRandomUser()
      let db = null
      db = await SequelizeTestUtils.getDatabase(db)

      const userModel = await db.user.create(randomUser)
      // Get options without currentTenant
      const options = {
        language: 'en',
        currentUser: userModel,
        database: db,
      } as IServiceOptions

      const tenantCreated = await new TenantService(options).create({
        name: 'testName',
        url: 'testUrl',
        integrationsRequired: ['github', 'discord'],
        communitySize: '>25000',
      })

      const tenantCreatedPlain = tenantCreated.get({ plain: true })

      tenantCreatedPlain.createdAt = tenantCreatedPlain.createdAt.toISOString().split('T')[0]
      tenantCreatedPlain.updatedAt = tenantCreatedPlain.updatedAt.toISOString().split('T')[0]

      const tenantExpected = {
        id: tenantCreatedPlain.id,
        name: 'testName',
        url: 'testUrl',
        plan: Plans.values.growth,
        isTrialPlan: true,
        trialEndsAt: moment().add(14, 'days').isAfter('2023-01-15')
          ? moment().add(14, 'days').toISOString()
          : new Date('2023-01-15T00:00:00.000Z'),
        planStatus: 'active',
        planStripeCustomerId: null,
        planUserId: null,
        onboardedAt: null,
        integrationsRequired: ['github', 'discord'],
        hasSampleData: false,
        communitySize: '>25000',
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        createdById: options.currentUser.id,
        updatedById: options.currentUser.id,
        settings: [],
        conversationSettings: [],
      }

      expect(tenantCreatedPlain).toStrictEqual(tenantExpected)

      // Check microservices (check_merge and members_score should be created with tenantService.create)
      const ms = new MicroserviceService({ ...options, currentTenant: tenantCreated })
      const microservicesOfTenant = await ms.findAndCountAll({})

      expect(microservicesOfTenant.count).toEqual(2)

      // findAndCountAll returns sorted by createdAt (desc) by default, so first one should be members_score
      expect(microservicesOfTenant.rows[0].type).toEqual('members_score')
      expect(microservicesOfTenant.rows[1].type).toEqual('check_merge')

      // Check default member attributes
      const mas = new MemberAttributeSettingsService({ ...options, currentTenant: tenantCreated })
      const defaultAttributes = await mas.findAndCountAll({ filter: {} })

      expect(defaultAttributes.rows.map((i) => i.name).sort()).toEqual([
        MemberAttributeName.BIO,
        MemberAttributeName.IS_TEAM_MEMBER,
        MemberAttributeName.JOB_TITLE,
        MemberAttributeName.LOCATION,
        MemberAttributeName.URL,
      ])

      const taskService = new TaskService({ ...options, currentTenant: tenantCreated })
      const suggestedTasks = await taskService.findAndCountAll({ filter: {} })
      expect(suggestedTasks.rows.map((i) => i.name).sort()).toStrictEqual([
        'Check for negative reactions',
        'Engage with relevant content',
        'Reach out to influential members',
        'Reach out to poorly engaged members',
        'Setup your team',
        'Setup your workpace integrations',
      ])
    })
  })
})
