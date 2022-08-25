import getUserContext from '../getUserContext'
import SequelizeTestUtils from '../sequelizeTestUtils'

const db = null

describe('Get user context tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Get user context tests', () => {
    it('Should get the user context for an existing tenant', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const tenantId = mockIRepositoryOptions.currentTenant.dataValues.id
      const userContext = await getUserContext(tenantId)
      expect(userContext.currentTenant.dataValues.id).toBe(tenantId)
      expect(userContext.currentUser).toBeDefined()
    })
  })
})
