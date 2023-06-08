import { OPENSEARCH_CONFIG } from '@/conf'
import { OpenSearchIndex } from '@/types'
import { Logger, LoggerBase } from '@crowd/logging'
import { Client } from '@opensearch-project/opensearch'

export default class OpenSearchService extends LoggerBase {
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
}
