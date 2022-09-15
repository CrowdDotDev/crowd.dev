/* eslint @typescript-eslint/no-unused-vars: 0 */

import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import Error400 from '../../errors/Error400'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import { GithubMemberAttributes } from '../../database/attributes/member/github'
import { DiscordMemberAttributes } from '../../database/attributes/member/discord'
import { TwitterMemberAttributes } from '../../database/attributes/member/twitter'
import { DevtoMemberAttributes } from '../../database/attributes/member/devto'
import { SlackMemberAttributes } from '../../database/attributes/member/slack'
import { AttributeType } from '../../database/attributes/types'

const db = null
describe('MemberAttributeSettingService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('createPredefined tests', () => {
    it('Should create predefined github attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(GithubMemberAttributes)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [
        nameCreated,
        isHireableCreated,
        urlCreated,
        websiteUrlCreated,
        bioCreated,
        companyCreated,
        locationCreated,
      ] = attributes

      const [name, isHireable, url, websiteUrl, bio, company, location] = GithubMemberAttributes

      const expected = [
        {
          id: nameCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: name.show,
          type: name.type,
          canDelete: name.canDelete,
          name: name.name,
          label: name.label,
        },
        {
          id: isHireableCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: isHireable.show,
          type: isHireable.type,
          canDelete: isHireable.canDelete,
          name: isHireable.name,
          label: isHireable.label,
        },
        {
          id: urlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: url.show,
          type: url.type,
          canDelete: url.canDelete,
          name: url.name,
          label: url.label,
        },
        {
          id: websiteUrlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: websiteUrl.show,
          type: websiteUrl.type,
          canDelete: websiteUrl.canDelete,
          name: websiteUrl.name,
          label: websiteUrl.label,
        },
        {
          id: bioCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: bio.show,
          type: bio.type,
          canDelete: bio.canDelete,
          name: bio.name,
          label: bio.label,
        },
        {
          id: companyCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: company.show,
          type: company.type,
          canDelete: company.canDelete,
          name: company.name,
          label: company.label,
        },
        {
          id: locationCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: location.show,
          type: location.type,
          canDelete: location.canDelete,
          name: location.name,
          label: location.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should create predefined discord attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(DiscordMemberAttributes)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated] = attributes

      const [id] = DiscordMemberAttributes

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should create predefined devto attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(DevtoMemberAttributes)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated, urlCreated, nameCreated, bioCreated, locationCreated] = attributes

      const [id, url, name, bio, location] = DevtoMemberAttributes

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: urlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: url.show,
          type: url.type,
          canDelete: url.canDelete,
          name: url.name,
          label: url.label,
        },
        {
          id: nameCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: name.show,
          type: name.type,
          canDelete: name.canDelete,
          name: name.name,
          label: name.label,
        },
        {
          id: bioCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: bio.show,
          type: bio.type,
          canDelete: bio.canDelete,
          name: bio.name,
          label: bio.label,
        },
        {
          id: locationCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: location.show,
          type: location.type,
          canDelete: location.canDelete,
          name: location.name,
          label: location.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should create predefined twitter attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(TwitterMemberAttributes)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated, imageUrlCreated, urlCreated] = attributes

      const [id, imageUrl, url] = TwitterMemberAttributes

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: imageUrlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: imageUrl.show,
          type: imageUrl.type,
          canDelete: imageUrl.canDelete,
          name: imageUrl.name,
          label: imageUrl.label,
        },
        {
          id: urlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: url.show,
          type: url.type,
          canDelete: url.canDelete,
          name: url.name,
          label: url.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should create predefined slack attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(SlackMemberAttributes)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated] = attributes

      const [id] = SlackMemberAttributes

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should accept duplicate attributes from different platforms without an exception', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = await as.createPredefined(TwitterMemberAttributes)

      const attributes2 = (await as.createPredefined(DevtoMemberAttributes)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      // create predefined method should still return shared attributes `url` and `id`
      const [idCreatedTwitter, _imageUrlCreated, urlCreatedTwitter] = attributes

      const [
        _idCreatedDevTo,
        _urlCreatedDevTo,
        nameCreatedDevTo,
        bioCreatedDevTo,
        locationCreatedDevTo,
      ] = attributes2

      const [id, url, name, bio, location] = DevtoMemberAttributes

      const expected = [
        {
          id: idCreatedTwitter.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: urlCreatedTwitter.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: url.show,
          type: url.type,
          canDelete: url.canDelete,
          name: url.name,
          label: url.label,
        },
        {
          id: nameCreatedDevTo.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: name.show,
          type: name.type,
          canDelete: name.canDelete,
          name: name.name,
          label: name.label,
        },
        {
          id: bioCreatedDevTo.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: bio.show,
          type: bio.type,
          canDelete: bio.canDelete,
          name: bio.name,
          label: bio.label,
        },
        {
          id: locationCreatedDevTo.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          show: location.show,
          type: location.type,
          canDelete: location.canDelete,
          name: location.name,
          label: location.label,
        },
      ]

      expect(attributes2).toEqual(expected)

      // find all attributes: url, name, id, imgUrl should be present
      const allAttributes = await as.findAndCountAll({})

      expect(allAttributes.count).toBe(6)
      const allAttributeNames = allAttributes.rows.map((attribute) => attribute.name)

      expect(allAttributeNames).toEqual(['bio', 'location', 'name', 'url', 'imageUrl', 'id'])
    })
  })
  describe('create tests', () => {
    it('Should add single attribute to member attributes - all fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = {
        name: 'att1',
        label: 'attribute 1',
        type: AttributeType.BOOLEAN,
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
        type: AttributeType.BOOLEAN,
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
        type: AttributeType.BOOLEAN,
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
        type: AttributeType.BOOLEAN,
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
        type: AttributeType.BOOLEAN,
        canDelete: true,
        show: true,
      })

      const attribute2 = await as.create({
        name: 'att2',
        label: 'attribute 2',
        type: AttributeType.STRING,
        canDelete: false,
        show: true,
      })

      const attribute3 = await as.create({
        name: 'att3',
        label: 'attribute 3',
        type: AttributeType.EMAIL,
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
        type: AttributeType.BOOLEAN,
        canDelete: true,
        show: true,
      })

      await expect(() =>
        as.update(attribute.id, {
          name: attribute.name,
          label: 'some other label',
          type: AttributeType.STRING,
        }),
      ).rejects.toThrowError(
        new Error400('en', 'settings.memberAttributes.errors.typesNotMatching', attribute.name),
      )
    })

    it(`Should throw canDeleteReadonly 400 error when updating an existing attribute's canDelete field to another value`, async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute = await as.create({
        name: 'attribute 1',
        label: 'attribute 1',
        type: AttributeType.BOOLEAN,
        canDelete: true,
        show: true,
      })

      await expect(() =>
        as.update(attribute.id, {
          canDelete: false,
          show: true,
        }),
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
        type: AttributeType.BOOLEAN,
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

      const updatedAttribute = await as.update(attribute.id, attribute1Update)

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
