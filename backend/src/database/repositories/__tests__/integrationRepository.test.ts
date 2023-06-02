import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import IntegrationRepository from '../integrationRepository'
import { PlatformType } from '@crowd/types'

const db = null

describe('Integration repository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('Find all active integrations', () => {
    it('Should find a single active integration', async () => {
      const int1 = {
        status: 'done',
        platform: PlatformType.TWITTER,
      }
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions)

      const found: any = await IntegrationRepository.findAllActive(PlatformType.TWITTER, 1, 100)
      expect(found[0].tenantId).toBeDefined()
      expect(found.length).toBe(1)
    })

    it('Should find all active integrations for a platform', async () => {
      const int1 = {
        status: 'done',
        platform: PlatformType.TWITTER,
      }
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions)

      const mockIRepositoryOptions2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions2)

      const found = await IntegrationRepository.findAllActive(PlatformType.TWITTER, 1, 100)
      expect(found.length).toBe(2)
    })

    it('Should only find active integrations', async () => {
      const int1 = {
        status: 'done',
        platform: PlatformType.TWITTER,
      }

      const int2 = {
        status: 'todo',
        platform: PlatformType.TWITTER,
      }

      const int3 = {
        status: 'in-progress',
        platform: PlatformType.TWITTER,
      }

      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions)

      const mockIRepositoryOptions2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions2)

      const mockIRepositoryOptions3 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int2, mockIRepositoryOptions3)

      const mockIRepositoryOptions4 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int3, mockIRepositoryOptions4)

      const found = await IntegrationRepository.findAllActive(PlatformType.TWITTER, 1, 100)
      expect(found.length).toBe(2)
    })

    it('Should only find integrations for the desired platform', async () => {
      const int1 = {
        status: 'done',
        platform: PlatformType.TWITTER,
      }

      const int2 = {
        status: 'active',
        platform: PlatformType.DISCORD,
      }

      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions)

      const mockIRepositoryOptions2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int1, mockIRepositoryOptions2)

      const mockIRepositoryOptions3 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await IntegrationRepository.create(int2, mockIRepositoryOptions3)

      const found = await IntegrationRepository.findAllActive(PlatformType.TWITTER, 1, 100)
      expect(found.length).toBe(2)
    })

    it('Should return an empty list if no integrations are found', async () => {
      const found = await IntegrationRepository.findAllActive(PlatformType.TWITTER, 1, 100)
      expect(found.length).toBe(0)
    })
  })
})
