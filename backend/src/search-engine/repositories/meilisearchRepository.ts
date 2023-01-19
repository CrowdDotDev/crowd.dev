/**
 * Contains meilisearch related utility functions
 */
export default class MeilisearchRepository {
  static isDocumentNotFoundError(error) {
    if (error.code === 'document_not_found' || error.code === 'index_not_found') {
      return true
    }
    return false
  }
}
