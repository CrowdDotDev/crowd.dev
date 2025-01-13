import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import TenantRepository from '../tenantRepository'

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
      })

      // now generate function should return 'a-tenant-name-1' because it already exists
      const generatedUrl = await TenantRepository.generateTenantUrl(tenantName, options)

      const expectedGeneratedUrl = 'a-tenant-name-1'

      expect(generatedUrl).toStrictEqual(expectedGeneratedUrl)
    })
  })
})
