import moment from 'moment'
import axios, { AxiosResponse } from 'axios'

import { EagleEyePostWithActions, EagleEyeRawPost } from '@crowd/types'

import { svc } from '../../main'
import { Content } from '../../types/email'
import { UserTenant } from '../../types/user'
import { switchDate } from '../../utils/date'

/*
fetchFromEagleEye is a Temporal activity that fetches the content to push inside
an email coming from EagleEye API.
*/
export async function fetchFromEagleEye(user: UserTenant): Promise<EagleEyeRawPost[]> {
  const feedSettings = user.settings.eagleEye.feed

  const keywords = feedSettings.keywords ? feedSettings.keywords.join(',') : ''
  const exactKeywords = feedSettings.exactKeywords ? feedSettings.exactKeywords.join(',') : ''
  const excludedKeywords = feedSettings.excludedKeywords
    ? feedSettings.excludedKeywords.join(',')
    : ''

  const afterDate = moment().format('YYYY-MM-DD')
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env['CROWD_EAGLE_EYE_URL'],
    params: {
      platforms: feedSettings.platforms.join(','),
      keywords: keywords,
      exact_keywords: exactKeywords,
      exclude_keywords: excludedKeywords,
      after_date: afterDate,
    },
    headers: {
      Authorization: `Bearer ${process.env['CROWD_EAGLE_EYE_API_KEY']}`,
    },
  }

  let response: AxiosResponse
  try {
    response = await axios(config)
  } catch (err) {
    throw new Error(err)
  }

  return response.data
}

/*
fetchFromDatabase is a Temporal activity that fetches the content to push inside
an email coming from the database.
*/
export async function fetchFromDatabase(user: UserTenant): Promise<EagleEyeRawPost[]> {
  const feedSettings = user.settings.eagleEye.emailDigest.feed || user.settings.eagleEye.feed
  const actualdate = switchDate(feedSettings.publishedDate, 90)

  let posts: EagleEyeRawPost[]
  try {
    posts = await svc.postgres.reader.connection().query(
      `SELECT url, post thumbnail, platform
        FROM "eagleEyeContents"
        WHERE "tenantId" = $1
        AND "postedAt" > $2;`,
      [user.tenantId, actualdate],
    )
  } catch (err) {
    throw new Error(err)
  }

  return posts
}

/*
buildEmailContent is a Temporal activity that builds the content of an email
based on posts previously fetched from EagleEye API and the database.
*/
export async function buildEmailContent(posts: Content): Promise<EagleEyePostWithActions[]> {
  const interactedMap = {}
  for (const item of posts.fromDatabase) {
    interactedMap[item.url] = item
  }

  const out: EagleEyePostWithActions[] = []
  for (const item of posts.fromEagleEye as EagleEyeRawPost[]) {
    const post = {
      description: item.description,
      thumbnail: item.thumbnail,
      title: item.title,
    }

    out.push({
      url: item.url,
      postedAt: item.date,
      post,
      platform: item.platform,
      actions: interactedMap[item.url] ? interactedMap[item.url].actions : [],
    })
  }

  const content = out.slice(0, 10).map((c: EagleEyePostWithActions) => {
    c.post.thumbnail = null
    return c
  })

  return content
}
