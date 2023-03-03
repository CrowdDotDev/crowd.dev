// import UserRepository from '../../database/repositories/userRepository'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'

const db = null

describe('QuickstartGuideService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('find method', () => {
    // it('Should find correct guides for different plans, with correct completed statuses', async () => {
    //   const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
    //   const user2 = await UserRepository.create(
    //     await SequelizeTestUtils.getRandomUser(),
    //     mockIRepositoryOptions,
    //   )
    // })
  })
})
