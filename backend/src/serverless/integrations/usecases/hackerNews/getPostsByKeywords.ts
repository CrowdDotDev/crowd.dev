import axios from 'axios'
import { IServiceOptions } from '../../../../services/IServiceOptions'
import { EagleEyeResponses, EagleEyeInput } from '../../types/hackerNewsTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import EagleEyeContentService from '../../../../services/eagleEyeContentService'

async function getChannels(
  input: EagleEyeInput,
  options: IServiceOptions,
  logger: Logger,
): Promise<EagleEyeResponses> {
  await timeout(2000)

  try {
    // const eagleEyeService = new EagleEyeContentService(options)
    // return await eagleEyeService.keywordMatch({ keywords: input.keywords, nDays: input.nDays })
    const postUrl = `https://hacker-news.firebaseio.com/v0/topstories.json`
    const postConfig = {
      method: 'get',
      url: postUrl,
    }
    const posts = await axios(postConfig)
    const out = []
    for (const post of posts.data.slice(0, 5)) {
      out.push({
        sourceId: `hackernews:${post}`,
        vectorId: 0,
        title: 'string',
        url: 'string',
        createdAt: '2021-03-31T20:00:00.000Z',
        text: 'string',
        username: 'string',
        platform: 'string',
        timestamp: '2021-03-31T20:00:00.000Z',
        userAttributes: {},
        postAttributes: {
          commentsCount: 0,
          score: 0
        },
        keywords: ['string']
      })
    }
    console.log(out)
    return out
  } catch (err) {
    logger.error({ err, input }, 'Error while getting posts by keyword in EagleEye')
    throw err
  }
}

export default getChannels
