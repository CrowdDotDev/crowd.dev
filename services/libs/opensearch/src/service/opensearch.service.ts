import {
  IndexVersions,
  OPENSEARCH_INDEX_MAPPINGS,
  OPENSEARCH_INDEX_SETTINGS,
  OpenSearchIndex,
} from '../types'
import { IS_DEV_ENV } from '@crowd/common'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { OPENSEARCH_IOC } from '../ioc_constants'
import { Client } from '@opensearch-project/opensearch'
import { inject, injectable } from 'inversify'
import { IIndexRequest, ISearchHit } from './opensearch.data'

@injectable()
export class OpenSearchService {
  private log: Logger
  private readonly indexVersionMap: Map<OpenSearchIndex, string> = new Map()

  constructor(
    @inject(OPENSEARCH_IOC.client)
    private readonly client: Client,
    @inject(LOGGING_IOC.logger)
    parentLog: Logger,
  ) {
    this.log = getChildLogger('opensearch-service', parentLog)

    const indexNames = Object.values(OpenSearchIndex)
    indexNames.forEach((name) => {
      const version = IndexVersions.get(name)
      this.indexVersionMap.set(name, `${name}_v${version}`)
    })
  }

  private async doesIndexExist(indexName: string): Promise<boolean> {
    try {
      const exists = await this.client.indices.exists({ index: indexName })
      return exists.body
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to check if index exists!')
      throw err
    }
  }

  private async doesAliasExist(aliasName: string): Promise<boolean> {
    try {
      const exists = await this.client.indices.existsAlias({
        name: aliasName,
      })
      return exists.body
    } catch (err) {
      this.log.error(err, { aliasName }, 'Failed to check if alias exists!')
      throw err
    }
  }

  private async doesAliasPointToIndex(indexName: string, aliasName: string): Promise<boolean> {
    try {
      const exists = await this.client.indices.existsAlias({
        name: aliasName,
        index: indexName,
      })
      return exists.body
    } catch (err) {
      this.log.error(err, { aliasName, indexName }, 'Failed to check if alias points to the index!')
      throw err
    }
  }

  public async createIndexWithVersion(indexName: OpenSearchIndex): Promise<void> {
    try {
      const settings = OPENSEARCH_INDEX_SETTINGS[indexName]
      const mappings = OPENSEARCH_INDEX_MAPPINGS[indexName]

      const versionedIndexName = this.indexVersionMap.get(indexName)

      await this.client.indices.create({
        index: versionedIndexName,
        body: {
          settings,
          mappings,
        },
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to create versioned index!')
      throw err
    }
  }

  public async createAlias(indexName: string, aliasName: string): Promise<void> {
    try {
      await this.client.indices.putAlias({
        index: indexName,
        name: aliasName,
      })
    } catch (err) {
      this.log.error(err, { aliasName, indexName }, 'Failed to create alias!')
      throw err
    }
  }

  private async pointAliasToCorrectIndex(indexName: string, aliasName: string): Promise<void> {
    try {
      // Updates alias by removing existing references and points it to the new index
      await this.client.indices.updateAliases({
        body: {
          actions: [
            { remove: { index: '*', alias: aliasName } },
            { add: { index: indexName, alias: aliasName } },
          ],
        },
      })
      this.log.info('Alias successfully updated', { aliasName, indexName })
    } catch (err) {
      this.log.error(err, { aliasName, indexName }, 'Failed to update alias!')
    }
  }

  public async reIndex(sourceIndex: string, targetIndex: string): Promise<void> {
    try {
      const response = await this.client.reindex({
        wait_for_completion: false, // should be false else it will return timeout error
        refresh: true,
        body: {
          source: {
            index: sourceIndex,
          },
          dest: {
            index: targetIndex,
          },
        },
      })
      return response?.body?.task
    } catch (err) {
      err.meta?.body?.failures?.forEach((failure) =>
        this.log.error(failure, 'Reindex failure details!'),
      )
      this.log.error(err, { sourceIndex, targetIndex }, 'Failed to reindex!')
      throw err
    }
  }

  // Count of documents in the index
  public async getDocumentCount(indexName: string): Promise<number> {
    try {
      const { body } = await this.client.count({
        index: indexName,
      })
      return body.count
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to get document count!')
      throw err
    }
  }

  public async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.client.indices.delete({
        index: indexName,
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to delete index!')
      throw err
    }
  }

  public async getIndexSettings(indexName: OpenSearchIndex): Promise<unknown> {
    try {
      const indexNameWithVersion = this.indexVersionMap.get(indexName)
      const settings = await this.client.indices.getSettings({
        index: indexNameWithVersion,
      })
      return settings.body
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to get index settings!')
      throw err
    }
  }

  public async getIndexMappings(indexName: OpenSearchIndex): Promise<unknown> {
    try {
      const indexNameWithVersion = this.indexVersionMap.get(indexName)
      const mappings = await this.client.indices.getMapping({
        index: indexNameWithVersion,
      })
      return mappings.body
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to get index mappings!')
      throw err
    }
  }

  public async setIndexMappings(indexName: OpenSearchIndex): Promise<void> {
    try {
      const mappings = OPENSEARCH_INDEX_MAPPINGS[indexName]
      const indexNameWithVersion = this.indexVersionMap.get(indexName)

      await this.client.indices.putMapping({
        index: indexNameWithVersion,
        body: mappings,
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to set index mappings!')
      throw err
    }
  }

  private async ensureIndexAndAliasExists(indexName: OpenSearchIndex) {
    const indexNameWithVersion = this.indexVersionMap.get(indexName)
    const aliasName = indexName // index name is the alias name (without version)
    const indexExists = await this.doesIndexExist(indexNameWithVersion)
    const aliasExists = await this.doesAliasExist(aliasName)
    const aliasPointsToIndex = await this.doesAliasPointToIndex(indexNameWithVersion, aliasName)

    // create index and alias if they don't exist (only in dev environment)
    if (IS_DEV_ENV) {
      if (!indexExists) {
        this.log.info('Creating versioned index with settings and mappings!', {
          indexNameWithVersion,
        })
        await this.createIndexWithVersion(indexName)
      }

      if (!aliasExists) {
        this.log.info('Creating alias for index!', { indexNameWithVersion, aliasName })
        await this.createAlias(indexNameWithVersion, aliasName)
      }
    } else {
      if (!indexExists || !aliasExists || !aliasPointsToIndex) {
        throw new Error('Index and alias are either missing or not properly configured!')
      }
    }

    // check if index and alias exist and alias points to the index
    if (indexExists && aliasExists && aliasPointsToIndex) {
      this.log.info('Index and alias already exist!', {
        indexNameWithVersion,
        aliasName,
      })
    }
  }

  public async initialize() {
    await this.client.cluster.putSettings({
      body: {
        persistent: {
          'action.auto_create_index': 'false',
        },
      },
    })
    await this.ensureIndexAndAliasExists(OpenSearchIndex.MEMBERS)
    await this.ensureIndexAndAliasExists(OpenSearchIndex.ACTIVITIES)
    await this.ensureIndexAndAliasExists(OpenSearchIndex.ORGANIZATIONS)
  }

  public async removeFromIndex(id: string, index: OpenSearchIndex): Promise<void> {
    try {
      const indexName = this.indexVersionMap.get(index)
      await this.client.delete({
        id,
        index: indexName,
        refresh: true,
      })
    } catch (err) {
      if (err.meta.statusCode === 404) {
        this.log.debug(err, { id, index }, 'Document not found in index!')
        return
      }
      this.log.error(err, { id, index }, 'Failed to remove document from index!')
      throw new Error(`Failed to remove document with id: ${id} from index ${index}!`)
    }
  }

  public async index<T>(id: string, index: OpenSearchIndex, body: T): Promise<void> {
    const indexName = this.indexVersionMap.get(index)
    try {
      await this.client.index({
        id,
        index: indexName,
        body,
        refresh: true,
      })
    } catch (err) {
      this.log.error(err, { id, index }, 'Failed to index document!')
      throw new Error(`Failed to index document with id: ${id} in index ${index}!`)
    }
  }

  public async bulkIndex<T>(index: OpenSearchIndex, batch: IIndexRequest<T>[]): Promise<void> {
    try {
      const body = []
      const indexName = this.indexVersionMap.get(index)
      for (const doc of batch) {
        body.push({
          index: { _index: indexName, _id: doc.id },
        })
        body.push({
          ...doc.body,
        })
      }

      const result = await this.client.bulk({
        body,
        refresh: true,
      })

      if (result.body.errors === true) {
        const errorItems = result.body.items
          .filter((i) => i.index !== undefined && i.index.error !== undefined)
          .map((i) => {
            return {
              error: i.index.error,
              itemId: i.index._id,
            }
          })

        this.log.error({ errorItems }, 'Failed to bulk index documents!')
        throw new Error(`Failed to bulk index documents in index ${index}!`)
      }
    } catch (err) {
      this.log.error(err, { index }, 'Failed to bulk index documents!')
      throw new Error(`Failed to bulk index documents in index ${index}!`)
    }
  }

  public async search<T>(
    index: OpenSearchIndex,
    query?: unknown,
    aggs?: unknown,
    size?: number,
    sort?: unknown[],
    searchAfter?: unknown,
    sourceIncludeFields?: string[],
    sourceExcludeFields?: string[],
  ): Promise<ISearchHit<T>[] | unknown> {
    try {
      const indexName = this.indexVersionMap.get(index)
      const payload = {
        index: indexName,
        _source_excludes: sourceExcludeFields,
        _source_includes: sourceIncludeFields,
        body: {
          size: aggs ? 0 : undefined,
          query,
          aggs,
          search_after: searchAfter ? [searchAfter] : undefined,
          sort,
        },
        size,
      }

      const data = await this.client.search(payload)

      if (query) {
        return data.body.hits.hits
      } else {
        return data.body.aggregations
      }
    } catch (err) {
      this.log.error(err, { index, query }, 'Failed to search documents!')
      throw new Error('Failed to search documents!')
    }
  }
}
