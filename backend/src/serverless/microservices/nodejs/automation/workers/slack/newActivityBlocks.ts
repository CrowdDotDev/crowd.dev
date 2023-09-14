import htmlToMrkdwn from 'html-to-mrkdwn-ts'
import { integrationLabel, integrationProfileUrl } from '@crowd/types'
import { API_CONFIG } from '../../../../../../conf'

const defaultAvatarUrl =
  'https://uploads-ssl.webflow.com/635150609746eee5c60c4aac/6502afc9d75946873c1efa93_image%20(292).png'

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
  const display = htmlToMrkdwn(replaceHeadline(activity.display.default))
  const reach = activity.member.reach?.[activity.platform] || activity.member.reach?.total

  const { member } = activity
  const memberProperties = []
  if (member.attributes.jobTitle?.default) {
    memberProperties.push(`*💼 Job title:* ${member.attributes.jobTitle?.default}`)
  }
  if (member.organizations.length > 0) {
    const orgs = member.organizations.map(
      (org) =>
        `<${`${API_CONFIG.frontendUrl}/organizations/${org.id}`}|${org.name || org.displayName}>`,
    )
    memberProperties.push(`*🏢 Organization:* ${orgs.join(' | ')}`)
  }
  if (reach > 0) {
    memberProperties.push(`*👥 Reach:* ${reach} followers`)
  }
  if (member.attributes?.location?.default) {
    memberProperties.push(`*📍 Location:* ${member.attributes?.location?.default}`)
  }
  if (member.emails.length > 0) {
    const [email] = member.emails
    memberProperties.push(`*✉️ Email:* <mailto:${email}|${email}>`)
  }
  const engagementLevel = computeEngagementLevel(activity.member.score || activity.engagement)
  if (engagementLevel.length > 0) {
    memberProperties.push(`*📊 Engagement level:* ${engagementLevel}`)
  }
  if (activity.member.activeOn) {
    const platforms = activity.member.activeOn
      .map((platform) => integrationLabel[platform] || platform)
      .join(' | ')
    memberProperties.push(`*💬 Active on:* ${platforms}`)
  }

  const profiles = Object.keys(member.username)
    .map((p) => {
      const username = (member.username?.[p] || []).length > 0 ? member.username[p][0] : null
      const url =
        member.attributes?.url?.[p] || (username && integrationProfileUrl[p](username)) || null
      return {
        platform: p,
        url,
      }
    })
    .filter((p) => !!p.url)

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${API_CONFIG.frontendUrl}/members/${activity.member.id}|${activity.member.displayName}>* *${display.text}*`,
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
      ...(activity.title || activity.body
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `>${
                  activity.title && activity.title !== activity.display.default
                    ? `*${htmlToMrkdwn(truncateText(activity.title, 120)).text.replaceAll('\n', '\n>')}* \n `
                    : ''
                }${htmlToMrkdwn(truncateText(activity.body, 260)).text.replaceAll('\n', '\n>')}`,
              },
            },
          ]
        : []),
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: memberProperties.join('\n'),
        },
        accessory: {
          type: 'image',
          image_url: member.attributes?.avatarUrl?.default ?? defaultAvatarUrl,
          alt_text: 'computer thumbnail',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View in crowd.dev',
              emoji: true,
            },
            url: `${API_CONFIG.frontendUrl}/members/${member.id}`,
          },
          ...(profiles.length > 0
            ? [
                {
                  type: 'overflow',
                  options: profiles.map(({ platform, url }) => ({
                    text: {
                      type: 'plain_text',
                      text: `${integrationLabel[platform] ?? platform} profile`,
                      emoji: true,
                    },
                    url,
                  })),
                },
              ]
            : []),
        ],
      },
    ],
  }
}
