import axios from 'axios'
import { HackerNewsPost, HackerNewsResponse, HackerNewsUser } from '../types'
import { IProcessStreamContext } from '@/types'

async function getPost(input: string, ctx: IProcessStreamContext): Promise<HackerNewsResponse> {
  try {
    ctx.log.info({ message: 'Fetching post from Hacker News', input })
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
    ctx.log.error({ err, input }, 'Error while getting post')
    throw err
  }
}

export default getPost
