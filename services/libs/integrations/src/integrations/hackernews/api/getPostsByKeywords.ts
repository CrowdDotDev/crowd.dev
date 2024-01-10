import axios from 'axios'
import { timeout } from '@crowd/common'
import {
  HackerNewsKeywordSearchInput,
  HackerNewsSearchResponseRaw,
  HackerNewsSearchResult,
} from '../types'
import { IProcessStreamContext } from '../../../types'

async function getPostsByKeyword(
  input: HackerNewsKeywordSearchInput,
  ctx: IProcessStreamContext,
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
    ctx.log.error({ err, input }, 'Error while getting posts by keyword in EagleEye')
    throw err
  }
}

export default getPostsByKeyword
