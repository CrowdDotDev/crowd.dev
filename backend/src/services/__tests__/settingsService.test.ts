import { Attribute } from '../../database/attributes/attribute'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import Error400 from '../../errors/Error400'
import SettingsService from '../settingsService'

const db = null

describe('SettingsService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Member Attributes tests', () => {
    it('Initial state should be an empty object for a new tenant in settings.memberAttributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const settings = await SettingsService.findOrCreateDefault(mockIRepositoryOptions)
      expect(settings.memberAttributes).toStrictEqual({})
    })

    describe('addMemberAttribute tests', () => {
      it('Should add single attribute to settings.memberAttributes - all fields', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'att1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        const attributeCreated = await SettingsService.addMemberAttribute(
          attribute1,
          mockIRepositoryOptions,
        )

        const attributeExpected = {
          name: attribute1.name,
          label: attribute1.label,
          type: attribute1.type,
          canDelete: attribute1.canDelete,
          show: attribute1.show,
        }

        expect(attributeCreated).toStrictEqual(attributeExpected)

        const settings = await SettingsService.findOrCreateDefault(mockIRepositoryOptions)

        expect(settings.memberAttributes[attribute1.name]).toStrictEqual(attributeExpected)
      })

      it('Should add single attribute to settings.memberAttributes - without default fields', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'att1',
          label: 'attribute 1',
          type: 'boolean',
        }

        const attributeCreated = await SettingsService.addMemberAttribute(
          attribute1,
          mockIRepositoryOptions,
        )

        // canDelete and show should be true by default
        const attributeExpected = {
          name: attribute1.name,
          label: attribute1.label,
          type: attribute1.type,
          canDelete: true,
          show: true,
        }

        expect(attributeCreated).toStrictEqual(attributeExpected)

        const settings = await SettingsService.findOrCreateDefault(mockIRepositoryOptions)

        expect(settings.memberAttributes[attribute1.name]).toStrictEqual(attributeExpected)
      })

      it('Should add single attribute to settings.memberAttributes - without default fields and name', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          label: 'an attribute with multiple words',
          type: 'boolean',
        }

        const attributeCreated = await SettingsService.addMemberAttribute(
          attribute1,
          mockIRepositoryOptions,
        )

        // name should be generated from the label
        const attributeExpected = {
          name: 'anAttributeWithMultipleWords',
          label: attribute1.label,
          type: attribute1.type,
          canDelete: true,
          show: true,
        }

        expect(attributeCreated).toStrictEqual(attributeExpected)

        const settings = await SettingsService.findOrCreateDefault(mockIRepositoryOptions)

        expect(settings.memberAttributes[attributeExpected.name]).toStrictEqual(attributeExpected)
      })

      it('Should throw requiredFields 400 error when type is missing', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'att1',
          label: 'attribute 1',
          canDelete: true,
          show: true,
        }

        await expect(() =>
          SettingsService.addMemberAttribute(attribute1, mockIRepositoryOptions),
        ).rejects.toThrowError(
          new Error400('en', 'settings.memberAttributes.errors.requiredFields'),
        )
      })

      it('Should throw requiredFields 400 error when label is missing', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'att1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        await expect(() =>
          SettingsService.addMemberAttribute(attribute1, mockIRepositoryOptions),
        ).rejects.toThrowError(
          new Error400('en', 'settings.memberAttributes.errors.requiredFields'),
        )
      })

      it('Should throw alreadyExists 400 error when trying to add an attribute with name that already exists', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'att1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        await SettingsService.addMemberAttribute(attribute1, mockIRepositoryOptions)

        const attribute2 = {
          name: 'att1',
          label: 'some other label',
          type: 'string',
          canDelete: false,
          show: false,
        }

        await expect(() =>
          SettingsService.addMemberAttribute(attribute2, mockIRepositoryOptions),
        ).rejects.toThrowError(
          new Error400('en', 'settings.memberAttributes.errors.alreadyExists', attribute1.name),
        )
      })
    })

    describe('removeMemberAttributes tests', () => {
      
    })

    describe('updateMemberAttribute tests', () => {
      it('Should throw notFound 404 error when attribute is not found with given name', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'att1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        await expect(() =>
          SettingsService.updateMemberAttribute(
            attribute1.name,
            attribute1,
            mockIRepositoryOptions,
          ),
        ).rejects.toThrowError(
          new Error400('en', 'settings.memberAttributes.errors.notFound', attribute1.name),
        )
      })

      it(`Should throw typesNotMatching 400 error when updating an existing attribute's type to another value`, async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'attribute 1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        await SettingsService.addMemberAttribute(attribute1, mockIRepositoryOptions)

        const attribute1Update = {
          name: attribute1.name,
          label: 'some other label',
          type: 'string',
        }

        await expect(() =>
          SettingsService.updateMemberAttribute(
            attribute1Update.name,
            attribute1Update,
            mockIRepositoryOptions,
          ),
        ).rejects.toThrowError(
          new Error400('en', 'settings.memberAttributes.errors.typesNotMatching', attribute1.name),
        )
      })

      it(`Should throw canDeleteReadonly 400 error when updating an existing attribute's canDelete field to another value`, async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'attribute 1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        await SettingsService.addMemberAttribute(attribute1, mockIRepositoryOptions)

        const attribute1Update = {
          canDelete: false,
          show: true,
        }

        await expect(() =>
          SettingsService.updateMemberAttribute(
            attribute1.name,
            attribute1Update,
            mockIRepositoryOptions,
          ),
        ).rejects.toThrowError(
          new Error400('en', 'settings.memberAttributes.errors.canDeleteReadonly', attribute1.name),
        )
      })

      it(`Should should update other cases successfully`, async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const attribute1 = {
          name: 'attribute 1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        await SettingsService.addMemberAttribute(attribute1, mockIRepositoryOptions)

        const attribute1Update = {
          name: attribute1.name,
          label: 'some other label',
          type: attribute1.type,
          canDelete: true,
          show: false,
        }

        const updatedAttribute = await SettingsService.updateMemberAttribute(
          attribute1.name,
          attribute1Update,
          mockIRepositoryOptions,
        )

        const expectedAttribute = {
          name: attribute1.name,
          label: attribute1Update.label,
          type: attribute1.type,
          canDelete: attribute1.canDelete,
          show: attribute1Update.show
        }

        expect(updatedAttribute).toStrictEqual(expectedAttribute)
      })
    })

    describe('addMemberAttributesBulk tests', () => {
      it('Should add a given attributes array to settings.memberAttributes', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        let settings = await SettingsService.findOrCreateDefault(mockIRepositoryOptions)

        const attribute1 = {
          name: 'att1',
          label: 'attribute 1',
          type: 'boolean',
          canDelete: true,
          show: true,
        }

        const attributeList1 = [attribute1] as Attribute[]

        settings = await SettingsService.addMemberAttributesBulk(
          attributeList1,
          mockIRepositoryOptions,
        )

        const expectedMemberAttributes = {
          [attribute1.name]: {
            name: attribute1.name,
            label: attribute1.label,
            type: attribute1.type,
            canDelete: attribute1.canDelete,
            show: attribute1.show,
          },
        }

        expect(settings.memberAttributes).toStrictEqual(expectedMemberAttributes)
      })
    })
  })
})
