import TenantRepository from '../tenantRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Plans from '../../../security/plans'

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
        plan: Plans.values.essential,
      }
      const ToCreatPlanForGrowthTenantOnTrial = {
        name: 'growth tenant name',
        url: 'a-growth-tenant-name',
        plan: Plans.values.growth,
      }
      const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await options.database.tenant.create(ToCreatePLanForEssentialPlanTenantOnTrial)
      const growthTenant = await options.database.tenant.create(ToCreatPlanForGrowthTenantOnTrial)
      const tenantIds = await TenantRepository.getPayingTenantIds(options)

      expect(tenantIds).toHaveLength(1)
      expect(growthTenant.id).toStrictEqual(tenantIds[0].id)
    })
  })

  describe('generateTenantUrl method', () => {
    it('Should generate a url from name - 0 existing tenants with same url', async () => {
      const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantName = 'some tenant Name with !@#_% non-alphanumeric characters'

      const generatedUrl = await TenantRepository.generateTenantUrl(tenantName, options)
      const expectedGeneratedUrl = 'some-tenant-name-with-non-alphanumeric-characters'

      expect(generatedUrl).toStrictEqual(expectedGeneratedUrl)
    })

    it('Should generate a url from name - with existing tenant that has the same url', async () => {
      const options = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantName = 'a tenant name'

      // create a tenant with url 'a-tenant-name'
      await options.database.tenant.create({
        name: tenantName,
        url: 'a-tenant-name',
        plan: Plans.values.essential,
      })

      // now generate function should return 'a-tenant-name-1' because it already exists
      const generatedUrl = await TenantRepository.generateTenantUrl(tenantName, options)

      const expectedGeneratedUrl = 'a-tenant-name-1'

      expect(generatedUrl).toStrictEqual(expectedGeneratedUrl)
    })
  })
})
