import htmlToMrkdwn from 'html-to-mrkdwn-ts'
import { integrationLabel } from '@crowd/types'
import { API_CONFIG } from '../../../../../../conf'

const computeEngagementLevel = (score) => {
  if (score <= 1) {
    return 'Silent'
  }
  if (score <= 3) {
    return 'Quiet'
  }
  if (score <= 6) {
    return 'Engaged'
  }
  if (score <= 8) {
    return 'Fan'
  }
  if (score <= 10) {
    return 'Ultra'
  }
  return ''
}

const replacements: Record<string, string> = {
  '/images/integrations/linkedin-reactions/like.svg': ':thumbsup:',
  '/images/integrations/linkedin-reactions/maybe.svg': ':thinking_face:',
  '/images/integrations/linkedin-reactions/praise.svg': ':clap:',
  '/images/integrations/linkedin-reactions/appreciation.svg': ':heart_hands:',
  '/images/integrations/linkedin-reactions/empathy.svg': ':heart:',
  '/images/integrations/linkedin-reactions/entertainment.svg': ':laughing:',
  '/images/integrations/linkedin-reactions/interest.svg': ':bulb:',
  'href="/': `href="${API_CONFIG.frontendUrl}/`,
}

const replaceHeadline = (text) => {
  Object.keys(replacements).forEach((key) => {
    text = text.replaceAll(key, replacements[key])
  })
  return text
}

const truncateText = (text: string, characters: number = 60): string => {
  if (text.length > characters) {
    return `${text.substring(0, characters)}...`
  }
  return text
}

export const newActivityBlocks = (activity) => {
  const display = htmlToMrkdwn(replaceHeadline(`${activity.display.default}`))
  const reach = activity.member.reach?.[activity.platform] || activity.member.reach?.total
  const memberProperties = []
  if (activity.member.attributes.jobTitle?.default) {
    memberProperties.push(activity.member.attributes.jobTitle?.default)
  }
  if (reach > 0) {
    memberProperties.push(`${reach} followers`)
  }
  const engagementLevel = computeEngagementLevel(activity.member.score || activity.engagement)
  if (engagementLevel.length > 0) {
    memberProperties.push(`*Engagement level:* ${engagementLevel}`)
  }
  if (activity.member.activeOn) {
    const platforms = activity.member.activeOn
      .map((platform) => integrationLabel[platform] || platform)
      .join(' | ')
    memberProperties.push(`*Active on:* ${platforms}`)
  }

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':satellite_antenna: *New activity*',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${API_CONFIG.frontendUrl}/members/${activity.member.id}|${
            activity.member.displayName
          }>* \n *${truncateText(display.text)}*`,
        },
        ...(activity.url
          ? {
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: `:arrow_upper_right: ${
                    activity.platform !== 'other'
                      ? `Open on ${integrationLabel[activity.platform]}`
                      : 'Open link'
                  }`,
                  emoji: true,
                },
                url: activity.url,
              },
            }
          : {}),
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: memberProperties.join(' • '),
          },
        ],
      },
    ],
    ...(activity.title || activity.body
      ? {
          attachments: [
            {
              color: '#eeeeee',
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `${
                      activity.title && activity.title !== activity.display.default
                        ? `*${htmlToMrkdwn(activity.title).text}* \n `
                        : ''
                    }${htmlToMrkdwn(activity.body).text}`,
                  },
                },
              ],
            },
          ],
        }
      : {}),
  }
}
