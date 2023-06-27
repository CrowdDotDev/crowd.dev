import { IMemberAttribute, OpenSearchIndex } from '@crowd/types'
import MemberTranslator from './memberTranslator'
import FieldTranslator from './fieldTranslator'

export class FieldTranslatorFactory {
  static getTranslator(
    index: OpenSearchIndex,
    attributes?: IMemberAttribute[],
    availablePlatforms?: string[],
  ): FieldTranslator {
    switch (index) {
      case OpenSearchIndex.MEMBERS:
        return new MemberTranslator(attributes, availablePlatforms)
      default:
        throw new Error(`Field translator for index ${index} not found!`)
    }
  }
}
