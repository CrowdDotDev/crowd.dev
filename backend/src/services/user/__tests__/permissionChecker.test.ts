import SequelizeTestUtils from '../../../database/utils/sequelizeTestUtils'
import Error400 from '../../../errors/Error400'
import Error403 from '../../../errors/Error403'
import Plans from '../../../security/plans'
import PermissionChecker from '../permissionChecker'
import { PlatformType } from '@crowd/types'

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
})
