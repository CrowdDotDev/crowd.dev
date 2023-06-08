import { OPENSEARCH_CONFIG } from '@/conf'
import { OpenSearchIndex } from '@/types'
import { Logger, LoggerBase } from '@crowd/logging'
import { Client } from '@opensearch-project/opensearch'
import { IIndexRequest } from './opensearch.data'

export class OpenSearchService extends LoggerBase {
  private readonly client: Client

  constructor(parentLog: Logger) {
    super(parentLog)

    this.client = new Client({
      node: OPENSEARCH_CONFIG().node,
    })
  }

  private async ensureIndexExists(indexName: OpenSearchIndex) {
    const exists = await this.client.indices.exists({ index: indexName })

    if (exists && [200, 404].includes(exists.statusCode)) {
      if (!exists.body) {
        // create index
        const response = await this.client.indices.create({
          index: indexName,
        })

        if (response && response.statusCode === 200) {
          this.log.info({ indexName }, 'Successfully created index!')
        } else {
          this.log.error({ indexName }, 'Failed to create index!')
        }
      } else {
        this.log.debug({ indexName }, 'Index already exists!')
      }
    } else {
      this.log.debug({ indexName }, 'Failed to check if index exists!')
    }
  }

  public async initialize() {
    await this.ensureIndexExists(OpenSearchIndex.MEMBERS)
  }

  public async removeFromIndex(id: string, index: OpenSearchIndex): Promise<void> {
    const response = await this.client.delete({
      id,
      index,
      refresh: true,
    })

    if (!(response && response.statusCode === 200)) {
      this.log.error({ id, index }, 'Failed to remove document from index!')
      throw new Error(`Failed to remove document with id: ${id} from index ${index}!`)
    }
  }

  public async index<T>(id: string, index: OpenSearchIndex, body: T): Promise<void> {
    const response = await this.client.index({
      id,
      index,
      body,
      refresh: true,
    })

    if (!(response && response.statusCode === 200)) {
      this.log.error({ id, index }, 'Failed to index document!')
      throw new Error(`Failed to index document with id: ${id} in index ${index}!`)
    }
  }

  public async bulkIndex<T>(index: OpenSearchIndex, batch: IIndexRequest<T>[]): Promise<void> {
    const body = batch.map((doc) => {
      return {
        index: {
          _index: index,
          _id: doc.id,
          data: doc.body,
        },
      }
    })

    const response = await this.client.bulk({
      body,
      refresh: true,
    })

    if (!(response && response.statusCode === 200)) {
      this.log.error({ index }, 'Failed to bulk index documents!')
      throw new Error(`Failed to bulk index documents in index ${index}!`)
    }
  }
}
