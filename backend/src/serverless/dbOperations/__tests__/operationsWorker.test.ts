import moment from 'moment'
import SequelizeTestUtils from '../../../database/utils/sequelizeTestUtils'
import ActivityService from '../../../services/activityService'
import MemberService from '../../../services/memberService'
import IntegrationService from '../../../services/integrationService'
import MicroserviceService from '../../../services/microserviceService'
import worker from '../operationsWorker'
import { PlatformType } from '../../../types/integrationEnums'
import { generateUUIDv1 } from '../../../utils/uuid'

const db = null

describe('Serverless database operations worker tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Bulk upsert method for members', () => {
    it('Should add a single simple member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id
      const member = {
        username: {
          [PlatformType.GITHUB]: {
            username: 'member1',
            integrationId: generateUUIDv1(),
          },
        },
        platform: PlatformType.GITHUB,
      }

      await worker(tenantId, 'upsert_members', [member])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const dbMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({})).rows

      expect(dbMembers.length).toBe(1)
      expect(dbMembers[0].username[PlatformType.GITHUB]).toBe('member1')
    })

    it('Should add a list of members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const members = [
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'member1',
              integrationId: generateUUIDv1(),
            },
          },
          platform: PlatformType.GITHUB,
        },
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'member2',
              integrationId: generateUUIDv1(),
            },
          },
          platform: PlatformType.SLACK,
        },
      ]

      await worker(tenantId, 'upsert_members', members)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const dbMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({})).rows

      expect(dbMembers.length).toBe(2)
    })

    it('Should work for an empty list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      await worker(tenantId, 'upsert_members', [])

      const dbMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({})).rows

      expect(dbMembers.length).toBe(0)
    })
  })

  describe('Bulk upsert method for activities with members', () => {
    it('Should add a single simple activity with members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id
      const ts = moment().toDate()
      const activity = {
        timestamp: ts,
        type: 'message',
        platform: 'api',
        member: {
          username: 'member1',
        },
        sourceId: '#sourceId1',
      }

      await worker(tenantId, 'upsert_activities_with_members', [activity])

      const dbActivities = (await new ActivityService(mockIRepositoryOptions).findAndCountAll({}))
        .rows

      expect(dbActivities.length).toBe(1)
      expect(moment(dbActivities[0].timestamp).unix()).toBe(moment(ts).unix())
    })

    it('Should add a list of activities with members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id
      const ts = moment().toDate()
      const ts2 = moment().subtract(2, 'days').toDate()

      const activities = [
        {
          timestamp: ts,
          type: 'message',
          platform: 'api',
          member: {
            username: 'member1',
          },
          sourceId: '#sourceId1',
        },
        {
          timestamp: ts2,
          type: 'message',
          platform: 'api',
          member: {
            username: 'member2',
          },
          sourceId: '#sourceId2',
        },
      ]

      await worker(tenantId, 'upsert_activities_with_members', activities)

      const dbActivities = (await new ActivityService(mockIRepositoryOptions).findAndCountAll({}))
        .rows
      expect(dbActivities.length).toBe(2)
    })

    it('Should work for an empty list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      await worker(tenantId, 'upsert_activities_with_members', [])

      const dbActivities = (await new ActivityService(mockIRepositoryOptions).findAndCountAll({}))
        .rows

      expect(dbActivities.length).toBe(0)
    })
  })

  describe('Bulk update method for members', () => {
    it('Should update a single member', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const member = {
        username: 'member1',
        platform: PlatformType.GITHUB,
        score: 1,
      }

      const dbMember = await new MemberService(mockIRepositoryOptions).upsert(member)
      const memberId = dbMember.id

      await worker(tenantId, 'update_members', [{ id: memberId, update: { score: 10 } }])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const dbMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({})).rows

      expect(dbMembers.length).toBe(1)
      expect(dbMembers[0].username[PlatformType.GITHUB]).toBe('member1')
      expect(dbMembers[0].score).toBe(10)
    })

    it('Should update a list of members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const members = [
        {
          username: 'member1',
          platform: PlatformType.GITHUB,
          score: 1,
        },
        {
          username: 'member2',
          platform: PlatformType.DISCORD,
          score: 2,
        },
      ]

      const memberIds = []
      for (const member of members) {
        const { id } = await new MemberService(mockIRepositoryOptions).upsert(member)
        memberIds.push(id)
      }

      await worker(tenantId, 'update_members', [
        { id: memberIds[0], update: { score: 10 } },
        { id: memberIds[1], update: { score: 3 } },
      ])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const dbMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({})).rows

      expect(dbMembers.length).toBe(2)
      expect(dbMembers[1].score).toBe(10)
      expect(dbMembers[0].score).toBe(3)
    })

    it('Should work for an empty list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      await worker(tenantId, 'update_members', [])

      const dbMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({})).rows

      expect(dbMembers.length).toBe(0)
    })
  })

  describe('Bulk update method for integrations', () => {
    it('Should update a single integration', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const integration = {
        platform: PlatformType.SLACK,
        integrationIdentifier: 'integration1',
        status: 'todo',
      }

      const dbIntegration = await new IntegrationService(mockIRepositoryOptions).create(integration)

      await worker(tenantId, 'update_integrations', [
        {
          id: dbIntegration.id,
          update: { status: 'done' },
        },
      ])

      const dbIntegrations = (
        await new IntegrationService(mockIRepositoryOptions).findAndCountAll({})
      ).rows
      expect(dbIntegrations.length).toBe(1)
      expect(dbIntegrations[0].status).toBe('done')
    })

    it('Should update a list of integrations', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const integrations = [
        {
          platform: PlatformType.SLACK,
          integrationIdentifier: 'integration1',
          status: 'todo',
        },
        {
          platform: PlatformType.SLACK,
          integrationIdentifier: 'integration2',
          status: 'todo',
        },
      ]

      const integrationIds = []
      for (const integration of integrations) {
        const { id } = await new IntegrationService(mockIRepositoryOptions).create(integration)
        integrationIds.push(id)
      }

      await worker(tenantId, 'update_integrations', [
        {
          id: integrationIds[0],
          update: { status: 'done' },
        },
      ])

      const dbIntegrations = (
        await new IntegrationService(mockIRepositoryOptions).findAndCountAll({})
      ).rows

      expect(dbIntegrations.length).toBe(2)
      expect(dbIntegrations[1].status).toBe('done')
      expect(dbIntegrations[0].status).toBe('todo')
    })

    it('Should work with an empty list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      await worker(tenantId, 'update_integrations', [])

      const dbIntegrations = (
        await new IntegrationService(mockIRepositoryOptions).findAndCountAll({})
      ).rows

      expect(dbIntegrations.length).toBe(0)
    })
  })

  describe('Bulk update method for microservice', () => {
    it('Should update a single microservice', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const microservice = {
        type: 'check_merge',
        running: false,
        init: true,
        variant: 'default',
      }

      const dbMs = await new MicroserviceService(mockIRepositoryOptions).create(microservice)

      await worker(tenantId, 'update_microservices', [
        {
          id: dbMs.id,
          update: { running: true },
        },
      ])

      const dbIntegrations = (
        await new MicroserviceService(mockIRepositoryOptions).findAndCountAll({})
      ).rows
      expect(dbIntegrations.length).toBe(1)
      expect(dbIntegrations[0].running).toBe(true)
    })

    it('Should update a list of microservices', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const microservices = [
        {
          type: 'check_merge',
          running: false,
          init: true,
          variant: 'default',
        },
        {
          type: 'member_score',
          running: false,
          init: true,
          variant: 'default',
        },
      ]

      const dbMs = await new MicroserviceService(mockIRepositoryOptions).create(microservices[0])
      const dbMs2 = await new MicroserviceService(mockIRepositoryOptions).create(microservices[1])

      await worker(tenantId, 'update_microservices', [
        {
          id: dbMs.id,
          update: { running: true },
        },
        {
          id: dbMs2.id,
          update: { running: true },
        },
      ])

      const dbIntegrations = (
        await new MicroserviceService(mockIRepositoryOptions).findAndCountAll({})
      ).rows
      expect(dbIntegrations.length).toBe(2)
      expect(dbIntegrations[0].running).toBe(true)
      expect(dbIntegrations[1].running).toBe(true)
    })

    it('Should work with an empty list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      await worker(tenantId, 'update_microservices', [])

      const dbIntegrations = (
        await new MicroserviceService(mockIRepositoryOptions).findAndCountAll({})
      ).rows

      expect(dbIntegrations.length).toBe(0)
    })
  })

  describe('Add members to merge method', () => {
    it('Should add members to merge in bulk', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const members = [
        {
          username: 'member1',
          platform: PlatformType.GITHUB,
          score: 1,
        },
        {
          username: 'member2',
          platform: PlatformType.TWITTER,
          score: 2,
        },
      ]

      const memberIds = []
      for (const member of members) {
        const { id } = await new MemberService(mockIRepositoryOptions).upsert(member)
        memberIds.push(id)
      }

      await worker(tenantId, 'update_members_to_merge', [
        [memberIds[0], memberIds[1]],
        [memberIds[1], memberIds[0]],
      ])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const dbMergeMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({}))
        .rows

      expect(dbMergeMembers.length).toBe(2)
      expect(dbMergeMembers[0].toMerge[0]).toStrictEqual(memberIds[0])
      expect(dbMergeMembers[1].toMerge[0]).toStrictEqual(memberIds[1])
    })

    it('Should work for an empty addToMerge list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      const members = [
        {
          username: {
            [PlatformType.GITHUB]: {
              username: 'member1',
              integrationId: generateUUIDv1(),
            },
          },
          platform: PlatformType.GITHUB,
          score: 1,
        },
        {
          username: {
            [PlatformType.SLACK]: {
              username: 'member2',
              integrationId: generateUUIDv1(),
            },
          },
          platform: PlatformType.SLACK,
          score: 2,
        },
      ]

      const memberIds = []
      for (const member of members) {
        const { id } = await new MemberService(mockIRepositoryOptions).upsert(member)
        memberIds.push(id)
      }

      await worker(tenantId, 'update_members_to_merge', [])

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const dbMergeMembers = (await new MemberService(mockIRepositoryOptions).findAndCountAll({}))
        .rows

      expect(dbMergeMembers.length).toBe(2)
      expect(dbMergeMembers[0].toMerge).toStrictEqual([])
      expect(dbMergeMembers[1].toMerge).toStrictEqual([])
    })
  })

  describe('Unknown operation', () => {
    it('Should throw an error', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id

      await expect(worker(tenantId, 'unknownOperation', [])).rejects.toThrow(
        'Operation unknownOperation not found',
      )
    })
  })
})
