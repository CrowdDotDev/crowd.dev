import axios from 'axios'
import { Logger } from '@crowd/logging'
import { timeout } from '@crowd/common'
import { IServiceOptions } from '../../../../services/IServiceOptions'
import {
  HackerNewsKeywordSearchInput,
  HackerNewsSearchResponseRaw,
  HackerNewsSearchResult,
} from '../../types/hackerNewsTypes'

async function getPostsByKeyword(
  input: HackerNewsKeywordSearchInput,
  options: IServiceOptions,
  logger: Logger,
): Promise<HackerNewsSearchResult[]> {
  await timeout(2000)

  try {
    const out = []
    const existing = new Set()
    for (const keyword of input.keywords) {
      const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'http://hn.algolia.com/api/v1/search',
        params: {
          query: `"${keyword}"`,
          numericFilters: `created_at_i>${input.after}`,
          tags: '(story,ask_hn,show_hn,poll)',
        },
        headers: {},
      }

      const response = await axios(config)
      const data = response.data as HackerNewsSearchResponseRaw

      for (const item of data.hits) {
        if (!existing.has(item.objectID)) {
          out.push({
            keywords: [keyword],
            postId: item.objectID,
          })
          existing.add(item.objectID)
        }
      }
    }
    return out
  } catch (err) {
    logger.error({ err, input }, 'Error while getting posts by keyword in EagleEye')
    throw err
  }
}

export default getPostsByKeyword
