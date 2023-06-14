import { IS_DEV_ENV } from '@crowd/common'
import { OPENSEARCH_CONFIG } from '@/conf'
import { OPENSEARCH_INDEX_MAPPINGS, OpenSearchIndex } from '@/types'
import { Logger, LoggerBase } from '@crowd/logging'
import { Client } from '@opensearch-project/opensearch'
import { IIndexRequest } from './opensearch.data'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'

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
      const exists = await this.client.indices.exists({ index: indexName })
      return exists.body
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to check if index exists!')
      throw err
    }
  }

  private async createIndex(indexName: OpenSearchIndex): Promise<void> {
    try {
      const mappings = OPENSEARCH_INDEX_MAPPINGS[indexName]
      await this.client.indices.create({
        index: indexName,
        body: {
          mappings,
        },
      })
    } catch (err) {
      this.log.error(err, { indexName }, 'Failed to create index!')
      throw err
    }
  }

  private async setIndexMappings(indexName: OpenSearchIndex): Promise<void> {
    try {
      const mappings = OPENSEARCH_INDEX_MAPPINGS[indexName]

      await this.client.indices.putMapping({
        index: indexName,
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

      if (IS_DEV_ENV) {
        this.log.info({ indexName }, 'Setting index mappings!')
        await this.setIndexMappings(indexName)
      }
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
  }

  public async removeFromIndex(id: string, index: OpenSearchIndex): Promise<void> {
    try {
      await this.client.delete({
        id,
        index,
        refresh: true,
      })
    } catch (err) {
      if (err.meta.statusCode === 404) {
        this.log.warn(err, { id, index }, 'Document not found in index!')
        return
      }
      this.log.error(err, { id, index }, 'Failed to remove document from index!')
      throw new Error(`Failed to remove document with id: ${id} from index ${index}!`)
    }
  }

  public async index<T>(id: string, index: OpenSearchIndex, body: T): Promise<void> {
    try {
      await this.client.index({
        id,
        index,
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
      for (const doc of batch) {
        body.push({
          index: { _index: index, _id: doc.id },
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
}
