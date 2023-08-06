import { OPENSEARCH_CONFIG } from '@/conf'
import {
  IndexVersions,
  OPENSEARCH_INDEX_MAPPINGS,
  OPENSEARCH_INDEX_SETTINGS,
  OpenSearchIndex,
} from '@/types'
import { Logger, LoggerBase } from '@crowd/logging'
import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'
import { IIndexRequest, ISearchHit } from './opensearch.data'
import { IS_DEV_ENV } from '@crowd/common'

export class OpenSearchService extends LoggerBase {
  private readonly client: Client

  constructor(parentLog: Logger) {
    super(parentLog)

    const config = OPENSEARCH_CONFIG()
    if (config.region) {
      this.client = new Client({
        node: config.node,
        ...AwsSigv4Signer({
          region: config.region,
          service: 'es',
          getCredentials: async () => {
            return {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          },
        }),
      })
    } else {
      this.client = new Client({
        node: config.node,
      })
    }
  }

  private async doesIndexExist(indexName: OpenSearchIndex): Promise<boolean> {
    try {
      const version = IndexVersions.get(indexName)

      // Only un dev environment, we check if the index exists with the version
      const indexToCheck = IS_DEV_ENV ? `${indexName}_v${version}` : indexName

      const exists = await this.client.indices.exists({ index: indexToCheck })
      return exists.body
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to check if index exists!')
      throw err
    }
  }

  public async createAlias(indexName: OpenSearchIndex, aliasName: string): Promise<void> {
    try {
      const version = IndexVersions.get(indexName)
      await this.client.indices.putAlias({
        index: `${indexName}_v${version}`,
        name: aliasName,
      })
    } catch (err) {
      this.log.error(err, { aliasName, indexName }, 'Failed to create alias!')
      throw err
    }
  }

  // create index with version in production
  public async createIndexWithVersion(indexName: OpenSearchIndex, version: number): Promise<void> {
    try {
      const settings = OPENSEARCH_INDEX_SETTINGS[indexName]
      const mappings = OPENSEARCH_INDEX_MAPPINGS[indexName]

      await this.client.indices.create({
        index: `${indexName}_v${version}`,
        body: {
          settings,
          mappings,
        },
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to create index!')
      throw err
    }
  }

  public async reIndex(sourceIndex: string, targetIndex: string): Promise<void> {
    try {
      await this.client.reindex({
        wait_for_completion: true,
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
    } catch (err) {
      this.log.error(err, { sourceIndex, targetIndex }, 'Failed to reindex!')
      throw err
    }
  }

  public async createIndex(indexName: OpenSearchIndex): Promise<void> {
    try {
      const settings = OPENSEARCH_INDEX_SETTINGS[indexName]
      const mappings = OPENSEARCH_INDEX_MAPPINGS[indexName]
      const version = IndexVersions.get(indexName)

      const indexToCreate = IS_DEV_ENV ? `${indexName}_v${version}` : indexName
      await this.client.indices.create({
        index: indexToCreate,
        body: {
          settings,
          mappings,
        },
      })

      if (IS_DEV_ENV) {
        // alias name is the same as the index name in dev
        const aliasName = indexName
        await this.createAlias(indexName, aliasName)
      }
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to create index!')
      throw err
    }
  }

  public async deleteIndex(indexName: OpenSearchIndex): Promise<void> {
    try {
      const version = IndexVersions.get(indexName)
      const indexToDelete = IS_DEV_ENV ? `${indexName}_v${version}` : indexName
      await this.client.indices.delete({
        index: indexToDelete,
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to delete index!')
      throw err
    }
  }

  public async getIndexSettings(indexName: OpenSearchIndex): Promise<unknown> {
    try {
      const version = IndexVersions.get(indexName)
      const settings = await this.client.indices.getSettings({
        index: `${indexName}_v${version}`,
      })
      return settings.body
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to get index settings!')
      throw err
    }
  }

  public async getIndexMappings(indexName: OpenSearchIndex): Promise<unknown> {
    try {
      const version = IndexVersions.get(indexName)
      const mappings = await this.client.indices.getMapping({
        index: `${indexName}_v${version}`,
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
      const version = IndexVersions.get(indexName)

      await this.client.indices.putMapping({
        index: `${indexName}_v${version}`,
        body: mappings,
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to set index mappings!')
      throw err
    }
  }

  private async ensureIndexExists(indexName: OpenSearchIndex) {
    const exists = await this.doesIndexExist(indexName)

    if (!exists) {
      // create index
      this.log.info({ indexName }, 'Creating index with mappings!')
      await this.createIndex(indexName)
    } else {
      this.log.info({ indexName }, 'Index already exists!')
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
    await this.ensureIndexExists(OpenSearchIndex.MEMBERS)
    await this.ensureIndexExists(OpenSearchIndex.ACTIVITIES)
  }

  public async removeFromIndex(id: string, index: OpenSearchIndex): Promise<void> {
    try {
      const version = IndexVersions.get(index)
      await this.client.delete({
        id,
        index: `${index}_v${version}`,
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
    const version = IndexVersions.get(index)
    try {
      await this.client.index({
        id,
        index: `${index}_v${version}`,
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
      const version = IndexVersions.get(index)
      for (const doc of batch) {
        body.push({
          index: { _index: `${index}_v${version}`, _id: doc.id },
        })
        body.push({
          ...doc.body,
        })
      }

      await this.client.bulk({
        body,
        refresh: true,
      })
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
      const version = IndexVersions.get(index)
      const payload = {
        index: `${index}_v${version}`,
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
