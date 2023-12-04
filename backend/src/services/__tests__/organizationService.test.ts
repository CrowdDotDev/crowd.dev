import organizationCacheRepository from '../../database/repositories/organizationCacheRepository'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import Plans from '../../security/plans'
import OrganizationService from '../organizationService'

const db = null

describe('OrganizationService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Create method', () => {
    it('Should create organization', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
          },
        ],
      }

      const added = await service.createOrUpdate(toAdd)
      expect(added.identities[0].url).toEqual(null)
    })

    it('Should throw an error when name is not sent', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(
        db,
        Plans.values.growth,
      )
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {}

      await expect(service.createOrUpdate(toAdd as any)).rejects.toThrowError(
        'Missing organization identity while creating/updating organization!',
      )
    })

    it('Should not re-create when existing: not enrich and name', async () => {
      const mockIServiceOptions = await SequelizeTestUtils.getTestIServiceOptions(db)
      const service = new OrganizationService(mockIServiceOptions)

      const toAdd = {
        identities: [
          {
            name: 'crowd.dev',
            platform: 'crowd',
          },
        ],
      }

      await service.createOrUpdate(toAdd)

      const added = await service.createOrUpdate(toAdd)
      expect(added.identities[0].name).toEqual(toAdd.identities[0].name)
      expect(added.identities[0].url).toBeNull()

      const foundAll = await service.findAndCountAll({
        filter: {},
        includeOrganizationsWithoutMembers: true,
      })
      expect(foundAll.count).toBe(1)
    })
  })
})
