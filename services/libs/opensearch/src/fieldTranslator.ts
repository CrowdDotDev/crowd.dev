import OpensearchModelBase from './models/base'
import { OpenSearchIndex, OpensearchField, OpensearchFieldType } from '@crowd/types'

export default abstract class FieldTranslator {
  index: OpenSearchIndex

  crowdToOpensearchMap: Map<string, string>

  opensearchToCrowdMap: Map<string, string>

  model: OpensearchModelBase

  translations: Record<string, string>

  constructor() {
    this.crowdToOpensearchMap = new Map<string, string>()
    this.opensearchToCrowdMap = new Map<string, string>()
  }

  crowdToOpensearch(crowdKey: string): string {
    return this.crowdToOpensearchMap.get(crowdKey)
  }

  opensearchToCrowd(opensearchKey: string): string {
    return this.opensearchToCrowdMap.get(opensearchKey)
  }

  setTranslationMaps(): void {
    for (const key of Object.keys(this.translations)) {
      if (this.model.fieldExists(key) && this.model.getField(key).customTranslation) {
        this.crowdToOpensearchMap.set(key, this.model.getField(key).customTranslation.toOpensearch)
        this.opensearchToCrowdMap.set(
          this.model.getField(key).customTranslation.fromOpensearch,
          key,
        )
      } else {
        this.crowdToOpensearchMap.set(key, this.translations[key])
        this.opensearchToCrowdMap.set(this.translations[key], key)
      }
    }
  }

  fieldExists(key: string): boolean {
    return this.model.fieldExists(key)
  }

  convertIfInt(modelField: OpensearchField, value: unknown): unknown {
    if (modelField?.type === OpensearchFieldType.INT) {
      return parseInt(value as string, 10)
    }
    return value
  }

  isNestedField(field: string): boolean {
    return field.startsWith('nested_')
  }

  translateObjectToCrowd(object: unknown): unknown {
    const translated = {}

    if (typeof object !== 'object' || object === null) {
      return object
    }

    if (Array.isArray(object)) {
      const translatedArray = []

      for (const objItem of object) {
        translatedArray.push(this.translateObjectToCrowd(objItem))
      }
      return translatedArray
    }

    for (const key of Object.keys(object)) {
      const crowdKey = this.opensearchToCrowd(key)
      if (crowdKey) {
        const modelField = this.model.getField(crowdKey)
        if (modelField?.type === OpensearchFieldType.STRING && modelField?.objectAsString) {
          translated[crowdKey] = JSON.parse(object[key])
        } else if (!modelField || !modelField.preventNestedFieldTranslation) {
          translated[crowdKey] = this.convertIfInt(
            modelField,
            this.translateObjectToCrowd(object[key]),
          )
        } else {
          if (modelField?.objectAsString) {
            translated[crowdKey] = object[key]
          }
        }
      }
    }

    return translated
  }
}
