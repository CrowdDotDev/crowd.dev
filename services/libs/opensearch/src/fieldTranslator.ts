import OpensearchModelBase from './models/base'
import { OpenSearchIndex } from '@crowd/types'

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
      this.crowdToOpensearchMap.set(key, this.translations[key])
      this.opensearchToCrowdMap.set(this.translations[key], key)
    }
  }

  fieldExists(key: string): boolean {
    return this.model.fieldExists(key)
  }

  translateObjectToCrowd(object: any): any {
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
      translated[crowdKey] = this.translateObjectToCrowd(object[key])
    }

    return translated
  }
}
