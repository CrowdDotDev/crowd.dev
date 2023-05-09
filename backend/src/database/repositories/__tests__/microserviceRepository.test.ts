import MicroserviceRepository from '../microserviceRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'

const db = null

describe('MicroserviceRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create a microservice succesfully with default values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice2Add = { type: 'members_score' }

      const microserviceCreated = await MicroserviceRepository.create(
        microservice2Add,
        mockIRepositoryOptions,
      )

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

    it('Should create a microservice succesfully with given values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice2Add = {
        init: true,
        running: true,
        type: 'members_score',
        variant: 'premium',
        settings: { testSettingsField: 'test' },
      }

      const microserviceCreated = await MicroserviceRepository.create(
        microservice2Add,
        mockIRepositoryOptions,
      )

      microserviceCreated.createdAt = microserviceCreated.createdAt.toISOString().split('T')[0]
      microserviceCreated.updatedAt = microserviceCreated.updatedAt.toISOString().split('T')[0]

      const microserviceExpected = {
        id: microserviceCreated.id,
        init: microservice2Add.init,
        running: microservice2Add.running,
        type: microservice2Add.type,
        variant: microservice2Add.variant,
        settings: microservice2Add.settings,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(microserviceCreated).toStrictEqual(microserviceExpected)
    })

    it('Should throw unique constraint error for creation of already existing type microservice in the same tenant', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice1 = {
        init: true,
        running: true,
        type: 'members_score',
        variant: 'premium',
        settings: { testSettingsField: 'test' },
      }

      await MicroserviceRepository.create(microservice1, mockIRepositoryOptions)

      await expect(() =>
        MicroserviceRepository.create({ type: 'members_score' }, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should throw not null error if no type is given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice2Add = {
        init: true,
        running: true,
        variant: 'premium',
        settings: { testSettingsField: 'test' },
      }

      await expect(() =>
        MicroserviceRepository.create(microservice2Add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created microservice by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice2Add = { type: 'members_score' }

      const microserviceCreated = await MicroserviceRepository.create(
        microservice2Add,
        mockIRepositoryOptions,
      )

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

      const microserviceById = await MicroserviceRepository.findById(
        microserviceCreated.id,
        mockIRepositoryOptions,
      )

      microserviceById.createdAt = microserviceById.createdAt.toISOString().split('T')[0]
      microserviceById.updatedAt = microserviceById.updatedAt.toISOString().split('T')[0]

      expect(microserviceById).toStrictEqual(microserviceExpected)
    })

    it('Should throw 404 error when no microservice found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        MicroserviceRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created microservice entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice1Created = await MicroserviceRepository.create(
        { type: 'members_score' },
        mockIRepositoryOptions,
      )
      const microservice2Created = await MicroserviceRepository.create(
        { type: 'second' },
        mockIRepositoryOptions,
      )

      const filterIdsReturned = await MicroserviceRepository.filterIdsInTenant(
        [microservice1Created.id, microservice2Created.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([microservice1Created.id, microservice2Created.id])
    })

    it('Should only return the ids of previously created microservices and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microserviceCreated = await MicroserviceRepository.create(
        { type: 'members_score' },
        mockIRepositoryOptions,
      )

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await MicroserviceRepository.filterIdsInTenant(
        [microserviceCreated.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([microserviceCreated.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microserviceCreated = await MicroserviceRepository.create(
        { type: 'members_score' },
        mockIRepositoryOptions,
      )

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await MicroserviceRepository.filterIdsInTenant(
        [microserviceCreated.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('findAndCountAll method', () => {
    it('Should find and count all microservices, with various filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microservice1Created = await MicroserviceRepository.create(
        { type: 'members_score', variant: 'premium' },
        mockIRepositoryOptions,
      )

      const microservice2Created = await MicroserviceRepository.create(
        { type: 'second', variant: 'premium' },
        mockIRepositoryOptions,
      )

      // Filter by type
      let microservices = await MicroserviceRepository.findAndCountAll(
        { filter: { type: 'members_score' } },
        mockIRepositoryOptions,
      )

      expect(microservices.count).toEqual(1)
      expect(microservices.rows).toStrictEqual([microservice1Created])

      // Filter by id
      microservices = await MicroserviceRepository.findAndCountAll(
        { filter: { id: microservice1Created.id } },
        mockIRepositoryOptions,
      )

      expect(microservices.count).toEqual(1)
      expect(microservices.rows).toStrictEqual([microservice1Created])

      // Filter by variant
      microservices = await MicroserviceRepository.findAndCountAll(
        { filter: { variant: 'premium' } },
        mockIRepositoryOptions,
      )

      expect(microservices.count).toEqual(2)
      expect(microservices.rows).toStrictEqual([microservice2Created, microservice1Created])
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created microservice', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microserviceCreated = await MicroserviceRepository.create(
        { type: 'twitter_followers' },
        mockIRepositoryOptions,
      )

      const microserviceUpdated = await MicroserviceRepository.update(
        microserviceCreated.id,
        {
          init: true,
          running: true,
          variant: 'premium',
          settings: {
            testSettingAttribute: {
              someAtt: 'test',
              someOtherAtt: true,
            },
          },
        },
        mockIRepositoryOptions,
      )

      expect(microserviceUpdated.updatedAt.getTime()).toBeGreaterThan(
        microserviceUpdated.createdAt.getTime(),
      )

      const microserviceExpected = {
        id: microserviceCreated.id,
        init: microserviceUpdated.init,
        running: microserviceUpdated.running,
        type: microserviceCreated.type,
        variant: microserviceUpdated.variant,
        settings: microserviceUpdated.settings,
        importHash: null,
        createdAt: microserviceCreated.createdAt,
        updatedAt: microserviceUpdated.updatedAt,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(microserviceUpdated).toStrictEqual(microserviceExpected)
    })

    it('Should throw 404 error when trying to update non existent microservice', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MicroserviceRepository.update(randomUUID(), { type: 'some-type' }, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
  describe('destroy method', () => {
    it('Should succesfully destroy previously created microservice', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const microserviceCreated = await MicroserviceRepository.create(
        { type: 'members_score', variant: 'premium' },
        mockIRepositoryOptions,
      )

      await MicroserviceRepository.destroy(microserviceCreated.id, mockIRepositoryOptions)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        MicroserviceRepository.findById(microserviceCreated.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent microservice', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MicroserviceRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('Find all available microservices', () => {
    it('Should find a single available microservices for a type', async () => {
      const ms1 = {
        type: 'twitter-followers',
        running: false,
        init: false,
        variant: 'default',
        settings: {},
      }
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms1, mockIRepositoryOptions)

      const found: any = await MicroserviceRepository.findAllByType('twitter-followers', 1, 100)
      expect(found[0].tenantId).toBeDefined()
      expect(found.length).toBe(1)
    })

    it('Should find all available microservices for a type, multiple available', async () => {
      const ms1 = {
        type: 'twitter-followers',
        running: false,
        init: false,
        variant: 'default',
        settings: {},
      }
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms1, mockIRepositoryOptions)

      const mockIRepositoryOptions2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms1, mockIRepositoryOptions2)

      const found = await MicroserviceRepository.findAllByType('twitter-followers', 1, 100)
      expect(found.length).toBe(2)
    })

    it('Should only find non-running microservices', async () => {
      const ms1 = {
        type: 'twitter-followers',
        running: false,
        init: false,
        variant: 'default',
        settings: {},
      }

      const ms2 = {
        type: 'twitter-followers',
        running: true,
        init: false,
        variant: 'default',
        settings: {},
      }

      const ms3 = {
        type: 'twitter-followers',
        running: false,
        init: false,
        variant: 'default',
        settings: {},
      }

      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms1, mockIRepositoryOptions)

      const mockIRepositoryOptions2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms2, mockIRepositoryOptions2)

      const mockIRepositoryOptions3 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms3, mockIRepositoryOptions3)

      const found = await MicroserviceRepository.findAllByType('twitter-followers', 1, 100)
      expect(found.length).toBe(2)
    })

    it('Should only find microservices for the desired type', async () => {
      const ms1 = {
        type: 'twitter-followers',
        running: false,
        init: false,
        variant: 'default',
        settings: {},
      }

      const ms2 = {
        type: 'members_score',
        running: false,
        init: false,
        variant: 'default',
        settings: {},
      }

      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms1, mockIRepositoryOptions)

      const mockIRepositoryOptions2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms1, mockIRepositoryOptions2)

      const mockIRepositoryOptions3 = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      await MicroserviceRepository.create(ms2, mockIRepositoryOptions3)

      const found = await MicroserviceRepository.findAllByType('twitter-followers', 1, 100)
      expect(found.length).toBe(2)
    })

    it('Should return an empty list if no integrations are found', async () => {
      const found = await MicroserviceRepository.findAllByType('twitter-followers', 1, 100)
      expect(found.length).toBe(0)
    })
  })
})
