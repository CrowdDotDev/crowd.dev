import SequelizeRepository from '../database/repositories/sequelizeRepository'
import SettingsRepository from '../database/repositories/settingsRepository'
import { Attribute } from '../database/attributes/attribute'
import Error400 from '../errors/Error400'
import Error404 from '../errors/Error404'

const DEFAULT_SETTINGS = {}

class SettingsService {
  static async findOrCreateDefault(options) {
    return SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)
  }

  static async save(data, options) {
    const transaction = await SequelizeRepository.createTransaction(options.database)

    // memberAttributes is managed through its own endpoints with more control
    if (data.memberAttributes) {
      delete data.memberAttributes
    }

    const settings = await SettingsRepository.save(data, options)

    await SequelizeRepository.commitTransaction(transaction)

    return settings
  }

  static async addMemberAttribute(data, options) {
    if (!data.type || !data.label) {
      throw new Error400(options.language, 'settings.memberAttributes.errors.requiredFields')
    }

    const { type, label, name, show, canDelete } = data

    const attribute = new Attribute(type, label, name, show, canDelete)

    let settings = await SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)

    // check attribute already exists
    if (settings.memberAttributes && settings.memberAttributes[attribute.name]) {
      throw new Error400(
        options.language,
        'settings.memberAttributes.errors.alreadyExists',
        attribute.name,
      )
    }

    settings.memberAttributes = {
      ...settings.memberAttributes,
      ...{
        [attribute.name]: { ...attribute },
      },
    }

    settings = await SettingsRepository.save(settings, options)

    return settings.memberAttributes[attribute.name]
  }

  static async removeMemberAttributes(names, options) {
    let settings = await SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)

    for (const attributeName of names) {
      if (
        settings.memberAttributes &&
        settings.memberAttributes[attributeName] &&
        settings.memberAttributes[attributeName].canDelete
      ) {
        delete settings.memberAttributes[attributeName]
      }
    }

    settings = await SettingsRepository.save(settings, options)

    return settings.memberAttributes
  }

  static async updateMemberAttribute(name, data, options) {
    let settings = await SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)

    // check attribute exists
    if (settings.memberAttributes && !settings.memberAttributes[name]) {
      throw new Error404(options.language, 'settings.memberAttributes.errors.notFound')
    }

    // we're not allowing updating attribute type to some other value
    if (data.type && settings.memberAttributes[name].type !== data.type) {
      throw new Error400(options.language, 'settings.memberAttributes.errors.typesNotMatching')
    }

    // readonly canDelete field can't be updated to some other value
    if (
      (data.canDelete === true ||
        data.canDelete === 'true' ||
        data.canDelete === false ||
        data.canDelete === 'false') &&
      settings.memberAttributes[name].canDelete !== data.canDelete
    ) {
      throw new Error400(options.language, 'settings.memberAttributes.errors.canDeleteReadonly')
    }

    // not allowing updating name field as well, delete just in case if name != data.name
    delete data.name

    settings.memberAttributes[name] = { ...settings.memberAttributes[name], ...data }

    settings = await SettingsRepository.save(settings, options)

    return settings.memberAttributes[name]
  }

  static async addMemberAttributesBulk(attributes: Attribute[], options) {
    let settings = await SettingsRepository.findOrCreateDefault(DEFAULT_SETTINGS, options)

    const associativeAttributes = attributes.reduce((acc, a) => {
      acc[a.name] = a
      return acc
    }, {})

    settings.memberAttributes = { ...associativeAttributes, ...settings.memberAttributes }

    settings = await SettingsRepository.save(settings, options)

    return settings
  }

  // static async loadAttributes(attributesData) {
  //   const attributes: Attribute[] = []
// 
  //   for (const attribute in attributesData) {
  //     if (Object.prototype.hasOwnProperty.call(attribute, attributesData)) {
  //       const { type, label, name, show, canDelete } = attributesData[attribute]
// 
  //       attributes.push(new Attribute(type, label, name, show, canDelete))
  //     }
  //   }
// 
  //   return attributes
  // }
}

export default SettingsService
