import { timeout } from '@crowd/common'
import axios from 'axios'

export interface IDevToArticle {
  id: number
  title: string
  description: string
  cover_image: string
  social_image: string
  readable_publish_date: string
  tag_list: string[]
  slug: string
  url: string
  comments_count: number
  published_at: string
  last_comment_at: string
}

export const getArticle = async (id: number, apiKey?: string): Promise<IDevToArticle> => {
  try {
    const result = await axios.get(
      `https://dev.to/api/articles/${encodeURIComponent(id.toString())}`,
      {
        headers: {
          Accept: 'application/vnd.forem.api-v1+json',
          'api-key': apiKey || '',
        },
      },
    )

    return result.data
  } catch (err) {
    // rate limit?
    if (err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10)
        if (retryAfterSeconds <= 2) {
          await timeout(1000 * retryAfterSeconds)
          return getArticle(id)
        }
      }
    }

    throw err
  }
}

export const getOrganizationArticles = async (
  organizationName: string,
  page: number,
  perPage: number,
  apiKey?: string,
): Promise<IDevToArticle[]> => {
  try {
    const result = await axios.get(
      `https://dev.to/api/organizations/${encodeURIComponent(organizationName)}/articles`,
      {
        params: {
          page,
          per_page: perPage,
        },
        headers: {
          Accept: 'application/vnd.forem.api-v1+json',
          'api-key': apiKey || '',
        },
      },
    )
    return result.data
  } catch (err) {
    if (err.response.status === 404) {
      return []
    }
    // rate limit?
    if (err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10)
        if (retryAfterSeconds <= 2) {
          await timeout(1000 * retryAfterSeconds)
          return getOrganizationArticles(organizationName, page, perPage)
        }
      }
    }

    throw err
  }
}

export const getUserArticles = async (
  username: string,
  page: number,
  perPage: number,
  apiKey?: string,
): Promise<IDevToArticle[]> => {
  try {
    const result = await axios.get(`https://dev.to/api/articles`, {
      params: {
        username,
        page,
        per_page: perPage,
      },
      headers: {
        Accept: 'application/vnd.forem.api-v1+json',
        'api-key': apiKey || '',
      },
    })
    return result.data
  } catch (err) {
    // rate limit?
    if (err.response.status === 429) {
      const retryAfter = err.response.headers['retry-after']
      if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10)
        if (retryAfterSeconds <= 2) {
          await timeout(1000 * retryAfterSeconds)
          return getUserArticles(username, page, perPage)
        }
      }
    }

    throw err
  }
}
