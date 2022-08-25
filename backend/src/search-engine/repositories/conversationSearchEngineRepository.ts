import Indexable from './indexable'

/**
 * Conversation repository layer for search engine
 * operations.
 * Implements Indexable abstract class to force INDEX_NAME
 * attribute. Also inherits trivial search engine operations
 */
class ConversationSearchEngineRepository extends Indexable {
  readonly INDEX_NAME: string = 'conversations'

  readonly SEARCHABLE_ATTRIBUTES: string[] = ['title', 'activitiesBodies']

  readonly FILTERABLE_ATTRIBUTES: string[] = [
    'platform',
    'slug',
    'channel',
    'tenantSlug',
    'homepageLink',
    'inviteLink',
  ]

  readonly SORTABLE_ATTRIBUTES: string[] = ['lastActive', 'views']

  constructor(options) {
    super()
    this.options = options
    this.index = this.getIndex(options)
  }
}
export default ConversationSearchEngineRepository
