import axios from 'axios'
import { HackerNewsPost, HackerNewsResponse, HackerNewsUser } from '../../types/hackerNewsTypes'
import { Logger } from '../../../../utils/logging'

async function getPost(input: string, logger: Logger): Promise<HackerNewsResponse> {
  try {
    const postUrl = `https://hacker-news.firebaseio.com/v0/item/${input}.json`
    const postConfig = {
      method: 'get',
      url: postUrl,
    }

    const postResponse: HackerNewsPost = (await axios(postConfig)).data
    const userId = postResponse.by

    const userUrl = `https://hacker-news.firebaseio.com/v0/user/${userId}.json`
    const userConfig = {
      method: 'get',
      url: userUrl,
    }

    const userResponse: HackerNewsUser = (await axios(userConfig)).data

    return {
      ...postResponse,
      user: userResponse,
    }
  } catch (err) {
    logger.error({ err, input }, 'Error while getting messages from Discord')
    throw err
  }
}

export default getPost
