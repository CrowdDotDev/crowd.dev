import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import Error400 from '../../errors/Error400'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'

const db = null

describe('MemberAttributeSettingService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('create tests', () => {
    it('Should add single attribute to member attributes - all fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = {
        name: 'att1',
        label: 'attribute 1',
        type: 'boolean',
        canDelete: true,
        show: true,
      }

      const attributeCreated = await as.create(attribute1)

      const attributeExpected = {
        ...attributeCreated,
        name: attribute1.name,
        label: attribute1.label,
        type: attribute1.type,
        canDelete: attribute1.canDelete,
        show: attribute1.show,
      }

      expect(attributeCreated).toStrictEqual(attributeExpected)
    })

    it('Should add single attribute to member attributes - without default fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = {
        name: 'att1',
        label: 'attribute 1',
        type: 'boolean',
      }

      const attributeCreated = await as.create(attribute1)

      // canDelete and show should be true by default
      const attributeExpected = {
        ...attributeCreated,
        name: attribute1.name,
        label: attribute1.label,
        type: attribute1.type,
        canDelete: true,
        show: true,
      }

      expect(attributeCreated).toStrictEqual(attributeExpected)
    })

    it('Should add single attribute to member attributes - without default fields and name', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = {
        label: 'an attribute with multiple words',
        type: 'boolean',
      }

      const attributeCreated = await as.create(attribute1)

      // name should be generated from the label
      const attributeExpected = {
        ...attributeCreated,
        name: 'anAttributeWithMultipleWords',
        label: attribute1.label,
        type: attribute1.type,
        canDelete: true,
        show: true,
      }

      expect(attributeCreated).toStrictEqual(attributeExpected)
    })
  })

  describe('destroyAll tests', () => {
    it('Should remove a single attribute succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute = await as.create({
        name: 'att1',
        label: 'attribute 1',
        type: 'boolean',
        canDelete: true,
        show: true,
      })

      await as.destroyAll([attribute.id])

      const allAttributes = await as.findAndCountAll({})

      expect(allAttributes.count).toBe(0)
      expect(allAttributes.rows).toStrictEqual([])
    })

    it('Should remove multiple existing attributes successfully, and should silently accept non existing names and keep the canDelete=false attributes intact', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = await as.create({
        name: 'att1',
        label: 'attribute 1',
        type: 'boolean',
        canDelete: true,
        show: true,
      })

      const attribute2 = await as.create({
        name: 'att2',
        label: 'attribute 2',
        type: 'string',
        canDelete: false,
        show: true,
      })

      const attribute3 = await as.create({
        name: 'att3',
        label: 'attribute 3',
        type: 'email',
        canDelete: true,
        show: false,
      })

      await as.destroyAll([attribute1.id, attribute2.id, attribute3.id])

      const allAttributes = await as.findAndCountAll({})

      expect(allAttributes.count).toBe(1)
      expect(allAttributes.rows).toStrictEqual([attribute2])
    })
  })

  describe('update tests', () => {
    it(`Should throw typesNotMatching 400 error when updating an existing attribute's type to another value`, async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute = await as.create({
        name: 'attribute 1',
        label: 'attribute 1',
        type: 'boolean',
        canDelete: true,
        show: true,
      })


      await expect(() =>
        as.update(
          attribute.id,
          {
            name: attribute.name,
            label: 'some other label',
            type: 'string',
          },
        ),
      ).rejects.toThrowError(
        new Error400('en', 'settings.memberAttributes.errors.typesNotMatching', attribute.name),
      )
    })

    it(`Should throw canDeleteReadonly 400 error when updating an existing attribute's canDelete field to another value`, async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute =  await as.create({
        name: 'attribute 1',
        label: 'attribute 1',
        type: 'boolean',
        canDelete: true,
        show: true,
      })

      await expect(() =>
        as.update(
          attribute.id,
          {
            canDelete: false,
            show: true,
          },
        ),
      ).rejects.toThrowError(
        new Error400('en', 'settings.memberAttributes.errors.canDeleteReadonly', attribute.name),
      )
    })

    it(`Should should update other cases successfully`, async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)
      
      const attribute = await as.create({
        name: 'attribute 1',
        label: 'attribute 1',
        type: 'boolean',
        canDelete: true,
        show: true,
      })

      const attribute1Update = {
        name: attribute.name,
        label: 'some other label',
        type: attribute.type,
        canDelete: true,
        show: false,
      }

      const updatedAttribute = await as.update(
        attribute.id,
        attribute1Update,
      )

      const expectedAttribute = {
        ...updatedAttribute,
        name: attribute.name,
        label: attribute1Update.label,
        type: attribute.type,
        canDelete: attribute.canDelete,
        show: attribute1Update.show,
      }

      expect(updatedAttribute).toStrictEqual(expectedAttribute)
    })
  })
})
