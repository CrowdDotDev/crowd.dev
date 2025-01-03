import { getRedisClient } from '@crowd/redis'
import { MemberAttributeName } from '@crowd/types'

import { REDIS_CONFIG } from '../../conf'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import { IServiceOptions } from '../IServiceOptions'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import MicroserviceService from '../microserviceService'
import TaskService from '../taskService'
import TenantService from '../tenantService'

const db = null

describe('TenantService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
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
        redis: await getRedisClient(REDIS_CONFIG, true),
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
        onboardedAt: null,
        integrationsRequired: ['github', 'discord'],
        communitySize: '>25000',
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        createdById: options.currentUser.id,
        updatedById: options.currentUser.id,
        settings: [],
        conversationSettings: [],
        reasonForUsingCrowd: null,
      }

      expect(tenantCreatedPlain).toStrictEqual(tenantExpected)

      // Check microservices (members_score should be created with tenantService.create)
      const ms = new MicroserviceService({ ...options, currentTenant: tenantCreated })
      const microservicesOfTenant = await ms.findAndCountAll({})

      expect(microservicesOfTenant.count).toEqual(1)

      // findAndCountAll returns sorted by createdAt (desc) by default, so first one should be members_score
      expect(microservicesOfTenant.rows[0].type).toEqual('members_score')

      // Check default member attributes
      const mas = new MemberAttributeSettingsService({ ...options, currentTenant: tenantCreated })
      const defaultAttributes = await mas.findAndCountAll({ filter: {} })

      expect(defaultAttributes.rows.map((i) => i.name).sort()).toEqual([
        MemberAttributeName.BIO,
        MemberAttributeName.COMPANY,
        MemberAttributeName.IS_BOT,
        MemberAttributeName.IS_ORGANIZATION,
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
        'Reach out to influential contacts',
        'Reach out to poorly engaged contacts',
        'Set up your team',
        'Set up your workspace integrations',
      ])
    })
  })
})
