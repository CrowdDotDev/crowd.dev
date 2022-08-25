import Indexable from './indexable'

/**
 * Conversation settings search engine repo layer
 */
class SettingsSearchEngineRepository extends Indexable {
  readonly INDEX_NAME: string = 'settings'

  readonly SEARCHABLE_ATTRIBUTES: string[] = []

  readonly FILTERABLE_ATTRIBUTES: string[] = ['tenantSlug', 'customUrl']

  readonly SORTABLE_ATTRIBUTES: string[] = []

  constructor(options) {
    super()
    this.options = options
    this.index = this.getIndex(options)
  }
}
export default SettingsSearchEngineRepository
