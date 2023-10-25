import axios, { AxiosResponse } from 'axios'
import moment from 'moment'
import sendgrid, { MailDataRequired } from '@sendgrid/mail'

import {
  EagleEyePostWithActions,
  EagleEyeRawPost,
} from '../../../../../backend/src/types/eagleEyeTypes'

import { svc } from '../main'
import { UserTenant, Content, EmailToSend, EmailSent } from '../types'
import { switchDate } from '../utils/date'

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

/*
sendEmail is a Temporal activity that sends an email to a user's email address
using the SendGrid API.
*/
export async function sendEmail(toSend: EmailToSend): Promise<EmailSent> {
  const email: MailDataRequired = {
    to: toSend.settings.eagleEye.emailDigest.email,
    from: {
      name: process.env['CROWD_SENDGRID_FROM_NAME'],
      email: process.env['CROWD_SENDGRID_FROM_EMAIL'],
    },
    templateId: process.env['CROWD_SENDGRID_TEMPLATE_EAGLEEYE_DIGEST'],
    dynamicTemplateData: {
      content: toSend.content,
      frequency: toSend.settings.eagleEye.emailDigest.frequency,
      date: moment().format('D MMM YYYY'),
      appHost: process.env['CROWD_FRONTEND_URL'],
    },
    customArgs: {
      tenantId: toSend.tenantId,
      userId: toSend.userId,
    },
  }

  try {
    await sendgrid.send(email)
  } catch (err) {
    throw new Error(err)
  }

  return {
    sentAt: new Date(),
  }
}
