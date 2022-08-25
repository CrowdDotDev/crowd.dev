import { ErrorStatusCode } from 'meilisearch'
/**
 * Contains meilisearch related utility functions
 */
export default class MeilisearchRepository {
  static isDocumentNotFoundError(error) {
    if (
      error.code === ErrorStatusCode.DOCUMENT_NOT_FOUND ||
      error.code === ErrorStatusCode.INDEX_NOT_FOUND
    ) {
      return true
    }
    return false
  }
}
