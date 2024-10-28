import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import MicroserviceService from '../microserviceService'

const db = null

describe('MicroService Service tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('CreateIfNotExists method', () => {
    it('Should create a microservice succesfully with default values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice2Add = { type: 'members_score' }

      const microserviceCreated = await new MicroserviceService(
        mockIRepositoryOptions,
      ).createIfNotExists(microservice2Add)

      microserviceCreated.createdAt = microserviceCreated.createdAt.toISOString().split('T')[0]
      microserviceCreated.updatedAt = microserviceCreated.updatedAt.toISOString().split('T')[0]

      const microserviceExpected = {
        id: microserviceCreated.id,
        init: false,
        running: false,
        type: microservice2Add.type,
        variant: 'default',
        settings: {},
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(microserviceCreated).toStrictEqual(microserviceExpected)
    })
    it('Should return the existing if it does not exist', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice2Add = { type: 'members_score' }

      const microserviceCreated = await new MicroserviceService(mockIRepositoryOptions).create(
        microservice2Add,
      )

      const secondCreated = await new MicroserviceService(mockIRepositoryOptions).createIfNotExists(
        microservice2Add,
      )

      secondCreated.createdAt = secondCreated.createdAt.toISOString().split('T')[0]
      secondCreated.updatedAt = secondCreated.updatedAt.toISOString().split('T')[0]

      const microserviceExpected = {
        id: microserviceCreated.id,
        init: false,
        running: false,
        type: microservice2Add.type,
        variant: 'default',
        settings: {},
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(secondCreated).toStrictEqual(microserviceExpected)
      const count = (await new MicroserviceService(mockIRepositoryOptions).findAndCountAll({}))
        .count
      expect(count).toBe(1)
    })
  })
})
