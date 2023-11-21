/* eslint @typescript-eslint/no-unused-vars: 0 */

import {
  DEVTO_MEMBER_ATTRIBUTES,
  DISCORD_MEMBER_ATTRIBUTES,
  GITHUB_MEMBER_ATTRIBUTES,
  SLACK_MEMBER_ATTRIBUTES,
  TWITTER_MEMBER_ATTRIBUTES,
} from '@crowd/integrations'
import { Error400 } from '@crowd/common'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import MemberAttributeSettingsService from '../memberAttributeSettingsService'
import { MemberAttributeType } from '@crowd/types'
import { RedisCache, getRedisClient } from '@crowd/redis'
import { REDIS_CONFIG } from '../../conf'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

let cache: RedisCache | undefined = undefined
const clearRedisCache = async () => {
  if (!cache) {
    const redis = await getRedisClient(REDIS_CONFIG)
    cache = new RedisCache('memberAttributes', redis, log)
  }

  await cache.deleteAll()
}

const db = null
describe('MemberAttributeSettingService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
    await clearRedisCache()
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('createPredefined tests', () => {
    it('Should create predefined github attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(GITHUB_MEMBER_ATTRIBUTES)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [
        isHireableCreated,
        urlCreated,
        websiteUrlCreated,
        bioCreated,
        companyCreated,
        locationCreated,
      ] = attributes

      const [isHireable, url, websiteUrl, bio, company, location] = GITHUB_MEMBER_ATTRIBUTES

      const expected = [
        {
          id: isHireableCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
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
          options: [],
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
          options: [],
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
          options: [],
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
          options: [],
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
          options: [],
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

      const attributes = (await as.createPredefined(DISCORD_MEMBER_ATTRIBUTES)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated, avatarUrlCreated] = attributes

      const [id, avatarUrl] = DISCORD_MEMBER_ATTRIBUTES

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: avatarUrlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: avatarUrl.show,
          type: avatarUrl.type,
          canDelete: avatarUrl.canDelete,
          name: avatarUrl.name,
          label: avatarUrl.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })

    it('Should create predefined devto attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(DEVTO_MEMBER_ATTRIBUTES)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated, urlCreated, nameCreated, bioCreated, locationCreated] = attributes

      const [id, url, name, bio, location] = DEVTO_MEMBER_ATTRIBUTES

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
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
          options: [],
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
          options: [],
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
          options: [],
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
          options: [],
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

      const attributes = (await as.createPredefined(TWITTER_MEMBER_ATTRIBUTES)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated, avatarUrlCreated, urlCreated, bioCreated, locationCreated] = attributes

      const [id, avatarUrl, url, bio, location] = TWITTER_MEMBER_ATTRIBUTES

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: avatarUrlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: avatarUrl.show,
          type: avatarUrl.type,
          canDelete: avatarUrl.canDelete,
          name: avatarUrl.name,
          label: avatarUrl.label,
        },
        {
          id: urlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: url.show,
          type: url.type,
          canDelete: url.canDelete,
          name: url.name,
          label: url.label,
        },
        {
          id: bioCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
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
          options: [],
          show: location.show,
          type: location.type,
          canDelete: location.canDelete,
          name: location.name,
          label: location.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should create predefined slack attributes', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = (await as.createPredefined(SLACK_MEMBER_ATTRIBUTES)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      const [idCreated, avatarUrlCreated, jobTitleCreated, timezoneCreated] = attributes

      const [id, avatarUrl, jobTitle, timezone] = SLACK_MEMBER_ATTRIBUTES

      const expected = [
        {
          id: idCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: avatarUrlCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: avatarUrl.show,
          type: avatarUrl.type,
          canDelete: avatarUrl.canDelete,
          name: avatarUrl.name,
          label: avatarUrl.label,
        },
        {
          id: jobTitleCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: jobTitle.show,
          type: jobTitle.type,
          canDelete: jobTitle.canDelete,
          name: jobTitle.name,
          label: jobTitle.label,
        },
        {
          id: timezoneCreated.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: timezone.show,
          type: timezone.type,
          canDelete: timezone.canDelete,
          name: timezone.name,
          label: timezone.label,
        },
      ]

      expect(attributes).toEqual(expected)
    })
    it('Should accept duplicate attributes from different platforms without an exception', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attributes = await as.createPredefined(TWITTER_MEMBER_ATTRIBUTES)

      const attributes2 = (await as.createPredefined(DEVTO_MEMBER_ATTRIBUTES)).map((attribute) => {
        attribute.createdAt = (attribute.createdAt as any).toISOString().split('T')[0]
        attribute.updatedAt = (attribute.updatedAt as any).toISOString().split('T')[0]
        return attribute
      })

      // create predefined method should still return shared attributes `url` and `id`
      const [
        idCreatedTwitter,
        _avatarUrlCreated,
        urlCreatedTwitter,
        bioCreatedTwitter,
        locationCreatedTwitter,
      ] = attributes

      const [
        _idCreatedDevTo,
        _urlCreatedDevTo,
        nameCreatedDevTo,
        _bioCreatedDevTo,
        _locationCreatedDevTo,
      ] = attributes2

      const [id, url, name, bio, location] = DEVTO_MEMBER_ATTRIBUTES
      console.log('urlCreatedTwitter', urlCreatedTwitter.id)
      console.log('urlCreatedDevTo', _urlCreatedDevTo.id)
      console.log('bioCreatedTwitter', bioCreatedTwitter.id)
      console.log('bioCreatedDevTo', _bioCreatedDevTo.id)
      console.log('locationCreatedTwitter', locationCreatedTwitter.id)
      console.log('locationCreatedDevTo', _locationCreatedDevTo.id)
      const expected = [
        {
          id: idCreatedTwitter.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: id.show,
          type: id.type,
          canDelete: id.canDelete,
          name: id.name,
          label: id.label,
        },
        {
          id: _urlCreatedDevTo.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
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
          options: [],
          show: name.show,
          type: name.type,
          canDelete: name.canDelete,
          name: name.name,
          label: name.label,
        },
        {
          id: _bioCreatedDevTo.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
          show: bio.show,
          type: bio.type,
          canDelete: bio.canDelete,
          name: bio.name,
          label: bio.label,
        },
        {
          id: _locationCreatedDevTo.id,
          createdAt: SequelizeTestUtils.getNowWithoutTime(),
          updatedAt: SequelizeTestUtils.getNowWithoutTime(),
          createdById: mockIRepositoryOptions.currentUser.id,
          updatedById: mockIRepositoryOptions.currentUser.id,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          options: [],
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

      expect(allAttributeNames).toEqual(['name', 'url', 'bio', 'location', 'avatarUrl', 'sourceId'])
    })
  })
  describe('create tests', () => {
    it('Should add single attribute to member attributes - all fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = {
        name: 'att1',
        label: 'attribute 1',
        type: MemberAttributeType.BOOLEAN,
        canDelete: true,
        show: true,
      }

      const attributeCreated = await as.create(attribute1)

      const attributeExpected = {
        ...attributeCreated,
        options: [],
        name: attribute1.name,
        label: attribute1.label,
        type: attribute1.type,
        canDelete: attribute1.canDelete,
        show: attribute1.show,
      }

      expect(attributeCreated).toStrictEqual(attributeExpected)
    })

    it('Should create a multi-select field with options', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const as = new MemberAttributeSettingsService(mockIRepositoryOptions)

      const attribute1 = {
        name: 'att1',
        label: 'attribute 1',
        type: MemberAttributeType.MULTI_SELECT,
        options: ['option1', 'option2'],
        canDelete: true,
        show: true,
      }

      const attributeCreated = await as.create(attribute1)

      const attributeExpected = {
        ...attributeCreated,
        options: ['option1', 'option2'],
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
        type: MemberAttributeType.BOOLEAN,
      }

      const attributeCreated = await as.create(attribute1)

      // canDelete and show should be true by default
      const attributeExpected = {
        ...attributeCreated,
        options: [],
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
        type: MemberAttributeType.BOOLEAN,
      }

      const attributeCreated = await as.create(attribute1)

      // name should be generated from the label
      const attributeExpected = {
        ...attributeCreated,
        options: [],
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
        type: MemberAttributeType.BOOLEAN,
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
        type: MemberAttributeType.BOOLEAN,
        canDelete: true,
        show: true,
      })

      const attribute2 = await as.create({
        name: 'att2',
        label: 'attribute 2',
        type: MemberAttributeType.STRING,
        canDelete: false,
        show: true,
      })

      const attribute3 = await as.create({
        name: 'att3',
        label: 'attribute 3',
        type: MemberAttributeType.EMAIL,
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
        type: MemberAttributeType.BOOLEAN,
        canDelete: true,
        show: true,
      })

      await expect(() =>
        as.update(attribute.id, {
          name: attribute.name,
          label: 'some other label',
          type: MemberAttributeType.STRING,
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
        type: MemberAttributeType.BOOLEAN,
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
        type: MemberAttributeType.BOOLEAN,
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

  describe('isCorrectType tests', () => {
    it(`Should check various types and values successfully`, async () => {
      const isCorrectType = MemberAttributeSettingsService.isCorrectType

      // boolean
      expect(isCorrectType(true, MemberAttributeType.BOOLEAN)).toBeTruthy()
      expect(isCorrectType(false, MemberAttributeType.BOOLEAN)).toBeTruthy()
      expect(isCorrectType('true', MemberAttributeType.BOOLEAN)).toBeTruthy()
      expect(isCorrectType('false', MemberAttributeType.BOOLEAN)).toBeTruthy()

      expect(isCorrectType(5, MemberAttributeType.BOOLEAN)).toBeFalsy()
      expect(isCorrectType('someString', MemberAttributeType.BOOLEAN)).toBeFalsy()
      expect(isCorrectType({}, MemberAttributeType.BOOLEAN)).toBeFalsy()
      expect(isCorrectType([], MemberAttributeType.BOOLEAN)).toBeFalsy()

      // string
      expect(isCorrectType('', MemberAttributeType.STRING)).toBeTruthy()
      expect(isCorrectType('someString', MemberAttributeType.STRING)).toBeTruthy()

      expect(isCorrectType(5, MemberAttributeType.STRING)).toBeFalsy()
      expect(isCorrectType(true, MemberAttributeType.STRING)).toBeFalsy()
      expect(isCorrectType({}, MemberAttributeType.STRING)).toBeFalsy()

      // date
      expect(isCorrectType('2022-05-10', MemberAttributeType.DATE)).toBeTruthy()
      expect(isCorrectType('2022-06-15T00:00:00', MemberAttributeType.DATE)).toBeTruthy()
      expect(isCorrectType('2022-07-14T00:00:00Z', MemberAttributeType.DATE)).toBeTruthy()

      expect(isCorrectType(5, MemberAttributeType.DATE)).toBeFalsy()
      expect(isCorrectType('someString', MemberAttributeType.DATE)).toBeFalsy()
      expect(isCorrectType('', MemberAttributeType.DATE)).toBeFalsy()
      expect(isCorrectType(true, MemberAttributeType.DATE)).toBeFalsy()
      expect(isCorrectType({}, MemberAttributeType.DATE)).toBeFalsy()
      expect(isCorrectType([], MemberAttributeType.DATE)).toBeFalsy()

      // email
      expect(isCorrectType('anil@crowd.dev', MemberAttributeType.EMAIL)).toBeTruthy()
      expect(isCorrectType('anil+123@crowd.dev', MemberAttributeType.EMAIL)).toBeTruthy()

      expect(isCorrectType(15, MemberAttributeType.EMAIL)).toBeFalsy()
      expect(isCorrectType('', MemberAttributeType.EMAIL)).toBeFalsy()
      expect(isCorrectType('someString', MemberAttributeType.EMAIL)).toBeFalsy()
      expect(isCorrectType(true, MemberAttributeType.EMAIL)).toBeFalsy()
      expect(isCorrectType({}, MemberAttributeType.EMAIL)).toBeFalsy()
      expect(isCorrectType([], MemberAttributeType.EMAIL)).toBeFalsy()

      // number
      expect(isCorrectType(100, MemberAttributeType.NUMBER)).toBeTruthy()
      expect(isCorrectType(5.123, MemberAttributeType.NUMBER)).toBeTruthy()
      expect(isCorrectType(0.000001, MemberAttributeType.NUMBER)).toBeTruthy()
      expect(isCorrectType(0, MemberAttributeType.NUMBER)).toBeTruthy()
      expect(isCorrectType('125', MemberAttributeType.NUMBER)).toBeTruthy()

      expect(isCorrectType('', MemberAttributeType.NUMBER)).toBeFalsy()
      expect(isCorrectType('someString', MemberAttributeType.NUMBER)).toBeFalsy()
      expect(isCorrectType(true, MemberAttributeType.NUMBER)).toBeFalsy()
      expect(isCorrectType({}, MemberAttributeType.NUMBER)).toBeFalsy()
      expect(isCorrectType([], MemberAttributeType.NUMBER)).toBeFalsy()

      // multiselect
      expect(
        isCorrectType(['a', 'b', 'c'], MemberAttributeType.MULTI_SELECT, {
          options: ['a', 'b', 'c', 'd'],
        }),
      ).toBeTruthy()
      expect(
        isCorrectType([], MemberAttributeType.MULTI_SELECT, { options: ['a', 'b', 'c', 'd'] }),
      ).toBeTruthy()
      expect(
        isCorrectType(['a'], MemberAttributeType.MULTI_SELECT, { options: ['a', 'b', 'c', 'd'] }),
      ).toBeTruthy()
      expect(
        isCorrectType(['a', '42'], MemberAttributeType.MULTI_SELECT, {
          options: ['a', 'b', 'c', 'd'],
        }),
      ).toBeFalsy()
      expect(
        isCorrectType('a', MemberAttributeType.MULTI_SELECT, { options: ['a', 'b', 'c'] }),
      ).toBeFalsy()
      expect(
        isCorrectType(5, MemberAttributeType.MULTI_SELECT, { options: ['a', 'b', 'c'] }),
      ).toBeFalsy()
    })
  })
})
