import MemberAttributeSettingsRepository from '../memberAttributeSettingsRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import { AttributeType } from '../../attributes/types'
import Error400 from '../../../errors/Error400'

const db = null

describe('MemberAttributeSettings tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create settings for a member attribute succesfully with default values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute = { type: AttributeType.BOOLEAN, label: 'attribute 1', name: 'attribute1' }

      const attributeCreated = await MemberAttributeSettingsRepository.create(
        attribute,
        mockIRepositoryOptions,
      )

      attributeCreated.createdAt = (attributeCreated.createdAt as any).toISOString().split('T')[0]
      attributeCreated.updatedAt = (attributeCreated.updatedAt as any).toISOString().split('T')[0]

      const attributeExpected = {
        id: attributeCreated.id,
        type: attribute.type,
        label: attribute.label,
        name: attribute.name,
        show: true,
        canDelete: true,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(attributeCreated).toStrictEqual(attributeExpected)
    })

    it('Should create settings for a member attribute succesfully with given values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute = {
        type: AttributeType.BOOLEAN,
        label: 'attribute 1',
        name: 'attribute1',
        canDelete: false,
        show: false,
      }

      const attributeCreated = await MemberAttributeSettingsRepository.create(
        attribute,
        mockIRepositoryOptions,
      )

      attributeCreated.createdAt = (attributeCreated.createdAt as any).toISOString().split('T')[0]
      attributeCreated.updatedAt = (attributeCreated.updatedAt as any).toISOString().split('T')[0]

      const attributeExpected = {
        id: attributeCreated.id,
        type: attribute.type,
        label: attribute.label,
        name: attribute.name,
        show: false,
        canDelete: false,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(attributeCreated).toStrictEqual(attributeExpected)
    })

    it('Should throw unique constraint error for creation of already existing member attributes with same name in the same tenant', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute = { type: AttributeType.BOOLEAN, label: 'attribute 1', name: 'attribute1' }

      await MemberAttributeSettingsRepository.create(attribute, mockIRepositoryOptions)

      await expect(() =>
        MemberAttributeSettingsRepository.create(
          { type: AttributeType.STRING, label: 'some label', name: 'attribute1' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()
    })

    it('Should throw not null error if no name, label or type is given', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // no type
      await expect(() =>
        MemberAttributeSettingsRepository.create(
          { type: undefined, label: 'attribute 1', name: 'attribute1' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()

      // no label
      await expect(() =>
        MemberAttributeSettingsRepository.create(
          { type: AttributeType.BOOLEAN, name: 'attribute1', label: undefined },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()

      // no name
      await expect(() =>
        MemberAttributeSettingsRepository.create(
          { type: AttributeType.BOOLEAN, label: 'attribute 1' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrow()
    })

    it('Should throw 400 error if name exists in member fixed fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // no type
      await expect(() =>
        MemberAttributeSettingsRepository.create(
          { type: AttributeType.STRING, label: 'Some Email', name: 'email' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrowError(
        new Error400('en', 'settings.memberAttributes.errors.reservedField', 'email'),
      )
    })
  })

  describe('findById method', () => {
    it('Should successfully find created member attribute by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute = { type: AttributeType.BOOLEAN, label: 'attribute 1', name: 'attribute1' }

      const attributeCreated = await MemberAttributeSettingsRepository.create(
        attribute,
        mockIRepositoryOptions,
      )

      const attributeExpected = {
        id: attributeCreated.id,
        type: attribute.type,
        label: attribute.label,
        name: attribute.name,
        show: true,
        canDelete: true,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      const attributeById = await MemberAttributeSettingsRepository.findById(
        attributeCreated.id,
        mockIRepositoryOptions,
      )

      attributeById.createdAt = (attributeCreated.createdAt as any).toISOString().split('T')[0]
      attributeById.updatedAt = (attributeCreated.updatedAt as any).toISOString().split('T')[0]

      expect(attributeById).toStrictEqual(attributeExpected)
    })
  })

  describe('findAndCountAll method', () => {
    it('Should find and count all member attributes, with various filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute1 = await MemberAttributeSettingsRepository.create(
        { type: AttributeType.BOOLEAN, label: 'a label', name: 'attribute1' },
        mockIRepositoryOptions,
      )

      const attribute2 = await MemberAttributeSettingsRepository.create(
        { type: AttributeType.STRING, label: 'a label', name: 'attribute2', show: false },
        mockIRepositoryOptions,
      )

      const attribute3 = await MemberAttributeSettingsRepository.create(
        {
          type: AttributeType.STRING,
          label: 'some other label',
          name: 'attribute3',
          show: false,
          canDelete: false,
        },
        mockIRepositoryOptions,
      )

      // filter by type
      let attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        { filter: { type: AttributeType.BOOLEAN } },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(1)
      expect(attributes.rows).toStrictEqual([attribute1])

      // filter by id
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        { filter: { id: attribute2.id } },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(1)
      expect(attributes.rows).toStrictEqual([attribute2])

      // filter by label
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        { filter: { label: 'a label' } },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(2)
      expect(attributes.rows).toStrictEqual([attribute2, attribute1])

      // filter by name
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        { filter: { name: 'attribute3' } },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(1)
      expect(attributes.rows).toStrictEqual([attribute3])

      // filter by show
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        { filter: { show: false } },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(2)
      expect(attributes.rows).toStrictEqual([attribute3, attribute2])

      // filter by canDelete
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        { filter: { canDelete: true } },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(2)
      expect(attributes.rows).toStrictEqual([attribute2, attribute1])

      // filter by createdAt between createdAt a1 and a3
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [attribute1.createdAt, attribute3.createdAt],
          },
        },
        mockIRepositoryOptions,
      )

      expect(attributes.count).toEqual(3)
      expect(attributes.rows).toStrictEqual([attribute3, attribute2, attribute1])

      // filter by createdAt <= att2.createdAt
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, attribute2.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(attributes.count).toEqual(2)
      expect(attributes.rows).toStrictEqual([attribute2, attribute1])

      // filter by createdAt <= att1.createdAt
      attributes = await MemberAttributeSettingsRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, attribute1.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(attributes.count).toEqual(1)
      expect(attributes.rows).toStrictEqual([attribute1])
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created attribute', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute = await MemberAttributeSettingsRepository.create(
        { type: AttributeType.BOOLEAN, label: 'attribute 1', name: 'attribute1' },
        mockIRepositoryOptions,
      )

      const attributeUpdated = await MemberAttributeSettingsRepository.update(
        attribute.id,
        {
          type: AttributeType.STRING,
          label: 'some other label',
          name: 'some name',
          show: false,
          canDelete: false,
        },
        mockIRepositoryOptions,
      )

      const attributeExpected = {
        id: attribute.id,
        type: attributeUpdated.type,
        label: attributeUpdated.label,
        name: attributeUpdated.name,
        show: attributeUpdated.show,
        canDelete: attributeUpdated.canDelete,
        createdAt: attribute.createdAt,
        updatedAt: attributeUpdated.updatedAt,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(attributeUpdated).toStrictEqual(attributeExpected)
    })

    it('Should throw 404 error when trying to update non existent attribute', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MemberAttributeSettingsRepository.update(
          randomUUID(),
          { type: 'some-type' } as any,
          mockIRepositoryOptions,
        ),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created attribute', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const attribute = await MemberAttributeSettingsRepository.create(
        { type: AttributeType.BOOLEAN, label: 'attribute 1', name: 'attribute1' },
        mockIRepositoryOptions,
      )

      await MemberAttributeSettingsRepository.destroy(attribute.id, mockIRepositoryOptions)

      await expect(() =>
        MemberAttributeSettingsRepository.findById(attribute.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent microservice', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        MemberAttributeSettingsRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
