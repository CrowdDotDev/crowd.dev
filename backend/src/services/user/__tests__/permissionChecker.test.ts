import SequelizeTestUtils from '../../../database/utils/sequelizeTestUtils'
import Error400 from '../../../errors/Error400'
import Error403 from '../../../errors/Error403'
import Plans from '../../../security/plans'
import PermissionChecker from '../permissionChecker'
import { PlatformType } from '../../../types/integrationEnums'

const db = null

describe('IntegrationService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Integration protected fields', () => {
    it('Should throw an error when limitCount is passed', async () => {
      for (const plan of Object.values(Plans.values)) {
        const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
        const permissionChecker = new PermissionChecker(mockIServiceOptions)
        const data = {
          limitCount: 1,
          status: 'in-progress',
          platform: PlatformType.GITHUB,
        }
        expect(() => permissionChecker.validateIntegrationsProtectedFields(data)).toThrow(
          new Error403(),
        )
      }
    })

    it('Should throw an error when limitCount is passed as 0', async () => {
      for (const plan of Object.values(Plans.values)) {
        const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
        const permissionChecker = new PermissionChecker(mockIServiceOptions)
        const data = {
          limitCount: 0,
          status: 'in-progress',
          platform: PlatformType.GITHUB,
        }
        expect(() => permissionChecker.validateIntegrationsProtectedFields(data)).toThrow(
          new Error403(),
        )
      }
    })
  })

  describe('Microservice protected fields', () => {
    it('Should throw an error when premium is passed for a free tenant', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const permissionChecker = new PermissionChecker(mockIServiceOptions)
      const data = {
        name: 'check_merge',
        variant: 'premium',
      }
      expect(() => permissionChecker.validateMicroservicesProtectedFields(data)).toThrow(
        new Error403(),
      )
    })

    it('Should pass when premium is passed for a premium tenant', async () => {
      const plan = Plans.values.growth
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const permissionChecker = new PermissionChecker(mockIServiceOptions)
      const data = {
        name: 'check_merge',
        variant: 'premium',
      }
      expect(permissionChecker.validateMicroservicesProtectedFields(data)).toBeUndefined()
    })

    it('Should always pass when free variant is passed', async () => {
      for (const plan of Object.values(Plans.values)) {
        const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
        const permissionChecker = new PermissionChecker(mockIServiceOptions)
        const data = {
          name: 'check_merge',
          variant: 'default',
        }
        expect(permissionChecker.validateMicroservicesProtectedFields(data)).toBeUndefined()
      }
    })
    it('Should throw an error for a wrong variant', async () => {
      const plan = Plans.values.essential
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db, plan)
      const permissionChecker = new PermissionChecker(mockIServiceOptions)
      const data = {
        name: 'check_merge',
        variant: 'wrong',
      }
      expect(() => permissionChecker.validateMicroservicesProtectedFields(data)).toThrow(
        new Error400('Invalid variant: wrong'),
      )
    })
  })
})
