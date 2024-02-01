import TenantRepository from '../tenantRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Plans from '../../../security/plans'
import { TenantPlans } from '@crowd/types'

const db = null

describe('TenantRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('getPayingTenantIds method', () => {
    it('should return tenants not using the essential plan', async () => {
      const ToCreatePLanForEssentialPlanTenantOnTrial = {
        name: 'essential tenant name',
        url: 'an-essential-tenant-name',
        plan: TenantPlans.Essential,
      }
      const ToCreatPlanForGrowthTenantOnTrial = {
        name: 'growth tenant name',
        url: 'a-growth-tenant-name',
        plan: TenantPlans.Growth,
      }
      const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await options.database.tenant.create(ToCreatePLanForEssentialPlanTenantOnTrial)
      const growthTenant = await options.database.tenant.create(ToCreatPlanForGrowthTenantOnTrial)
      const tenantIds = await TenantRepository.getPayingTenantIds(options)

      expect(tenantIds).toHaveLength(1)
      expect(growthTenant.id).toStrictEqual(tenantIds[0].id)
    })
  })
})
