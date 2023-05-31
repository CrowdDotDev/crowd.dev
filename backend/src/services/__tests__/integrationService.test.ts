import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import IntegrationService from '../integrationService'
import { PlatformType } from '@crowd/types'

const db = null

describe('IntegrationService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('createOrUpdate', () => {
    it('Should create a new integration because platform does not exist yet', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const integrationService = new IntegrationService(mockIServiceOptions)

      const integrationToCreate = {
        platform: PlatformType.GITHUB,
        token: '1234',
        integrationIdentifier: '1234',
        status: 'in-progress',
      }

      let integrations = await integrationService.findAndCountAll({})
      expect(integrations.count).toEqual(0)

      await integrationService.createOrUpdate(integrationToCreate)
      integrations = await integrationService.findAndCountAll({})

      expect(integrations.count).toEqual(1)
    })

    it('Should update existing integration if platform already exists', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const integrationService = new IntegrationService(mockIServiceOptions)

      const integrationToCreate = {
        platform: PlatformType.GITHUB,
        token: '1234',
        integrationIdentifier: '1234',
        status: 'in-progress',
      }

      await integrationService.createOrUpdate(integrationToCreate)
      let integrations = await integrationService.findAndCountAll({})
      expect(integrations.count).toEqual(1)
      expect(integrations.rows[0].status).toEqual('in-progress')

      const integrationToUpdate = {
        platform: PlatformType.GITHUB,
        token: '1234',
        integrationIdentifier: '1234',
        status: 'done',
      }

      await integrationService.createOrUpdate(integrationToUpdate)
      integrations = await integrationService.findAndCountAll({})
      expect(integrations.count).toEqual(1)
      expect(integrations.rows[0].status).toEqual('done')
    })
  })

  describe('Find all active integrations tests', () => {
    it('Should find an empty list when there are no integrations', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      expect(
        (await new IntegrationService(mockIServiceOptions).getAllActiveIntegrations()).count,
      ).toBe(0)
    })

    it('Should return n for n active integrations', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      await new IntegrationService(mockIServiceOptions).createOrUpdate({
        platform: PlatformType.SLACK,
        status: 'done',
      })
      expect(
        (await new IntegrationService(mockIServiceOptions).getAllActiveIntegrations()).count,
      ).toBe(1)

      await new IntegrationService(mockIServiceOptions).createOrUpdate({
        platform: PlatformType.GITHUB,
        status: 'done',
      })
      expect(
        (await new IntegrationService(mockIServiceOptions).getAllActiveIntegrations()).count,
      ).toBe(2)
    })

    it('Should return n for n active integrations when there are other integrations', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)

      await new IntegrationService(mockIServiceOptions).createOrUpdate({
        platform: PlatformType.SLACK,
        status: 'done',
      })
      await new IntegrationService(mockIServiceOptions).createOrUpdate({
        platform: PlatformType.DISCORD,
        status: 'in-progress',
      })

      expect(
        (await new IntegrationService(mockIServiceOptions).getAllActiveIntegrations()).count,
      ).toBe(1)

      await new IntegrationService(mockIServiceOptions).createOrUpdate({
        platform: PlatformType.GITHUB,
        status: 'done',
      })
      expect(
        (await new IntegrationService(mockIServiceOptions).getAllActiveIntegrations()).count,
      ).toBe(2)
    })
  })
})
