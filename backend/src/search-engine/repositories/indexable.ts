import { Index, Document } from 'meilisearch'
import MeilisearchRepository from './meilisearchRepository'

export default abstract class Indexable {
  abstract readonly INDEX_NAME: string

  abstract readonly SEARCHABLE_ATTRIBUTES: string[]

  abstract readonly FILTERABLE_ATTRIBUTES: string[]

  abstract readonly SORTABLE_ATTRIBUTES: string[]

  index: Index

  options

  /**
   * Returns local instance of search engine index
   * @param options options object - options.searchEngine
   * must contain search engine client object
   * @returns {Index} search engine index instance
   */
  getIndex(options): Index {
    return options.searchEngine.index(this.INDEX_NAME)
  }

  /**
   * Ensures given class attributes for search, sort and filter operations
   */
  async ensureIndexAttributes(): Promise<void> {
    await this.index.updateFilterableAttributes(this.FILTERABLE_ATTRIBUTES)
    await this.index.updateSearchableAttributes(this.SEARCHABLE_ATTRIBUTES)
    await this.index.updateSortableAttributes(this.SORTABLE_ATTRIBUTES)
  }

  /**
   * Retrieve document by id
   * Returns null if document is not found
   * @param {string} id document id
   * @returns {Document|null}
   */
  async findById(id: string): Promise<Document> {
    try {
      const doc = await this.index.getDocument(id)
      return doc
    } catch (error) {
      if (MeilisearchRepository.isDocumentNotFoundError(error)) {
        return null
      }
      throw error
    }
  }

  /**
   * Creates given document in the index.
   * If documentId already exists, replaces old document with the new one
   * @param {Document} document document to be created
   */
  async createOrReplace(document: Document): Promise<void> {
    await this.index.addDocuments([document])
  }

  /**
   * Deletes the document with given id from the index.
   * @param {string} id
   */
  async delete(id: string) {
      await this.index.deleteDocument(id)
  }
}
