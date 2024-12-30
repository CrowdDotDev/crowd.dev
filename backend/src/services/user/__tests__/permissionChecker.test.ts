import { Error403 } from '@crowd/common'
import { PlatformType, TenantPlans } from '@crowd/types'

import SequelizeTestUtils from '../../../database/utils/sequelizeTestUtils'
import Plans from '../../../security/plans'
import PermissionChecker from '../permissionChecker'

const db = null

describe('PermissionChecker tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Integration protected fields', () => {
    it('Should throw an error when limitCount is passed', async () => {
      for (const plan of Object.values(TenantPlans)) {
        const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
          db,
          plan as TenantPlans,
        )
        const permissionChecker = new PermissionChecker(mockIServiceOptions)
        const data = {
          limitCount: 1,
          status: 'in-progress',
          platform: PlatformType.GITHUB,
        }
        expect(() => permissionChecker.validateIntegrationsProtectedFields(data)).toThrow(Error403)
      }
    })

    it('Should throw an error when limitCount is passed as 0', async () => {
      for (const plan of Object.values(TenantPlans)) {
        const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
          db,
          plan as TenantPlans,
        )
        const permissionChecker = new PermissionChecker(mockIServiceOptions)
        const data = {
          limitCount: 0,
          status: 'in-progress',
          platform: PlatformType.GITHUB,
        }
        expect(() => permissionChecker.validateIntegrationsProtectedFields(data)).toThrow(Error403)
      }
    })
  })
})
