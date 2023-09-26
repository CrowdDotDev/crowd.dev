import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { OPENSEARCH_IOC } from '@crowd/opensearch'
import { OpenSearchIndex } from '@crowd/types'
import { Client } from '@opensearch-project/opensearch'
import { inject, injectable } from 'inversify'
import { ISearchHit } from './opensearch.data'

@injectable()
export class OpenSearchService {
  private log: Logger

  public readonly client: Client

  constructor(
    @inject(LOGGING_IOC.logger)
    parentLog: Logger,
    @inject(OPENSEARCH_IOC.client)
    client: Client,
  ) {
    this.log = getChildLogger('opensearch-service', parentLog)
    this.client = client
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
      const payload = {
        index,
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
