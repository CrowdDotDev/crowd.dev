import htmlToMrkdwn from 'html-to-mrkdwn-ts'

import { integrationLabel, integrationProfileUrl } from '@crowd/types'

import { FRONTEND_URL } from '../../main'

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
  'href="/': `href="${FRONTEND_URL}/`,
}

const replaceHeadline = (text) => {
  Object.keys(replacements).forEach((key) => {
    text = text.replaceAll(key, replacements[key])
  })
  return text
}

const truncateText = (text: string, characters = 60): string => {
  if (text.length > characters) {
    return `${text.substring(0, characters)}...`
  }
  return text
}

export const newActivityBlocks = (activity) => {
  // Which platform identities are displayed as buttons and which ones go to menu
  let buttonPlatforms = ['github', 'twitter', 'linkedin']

  const display = htmlToMrkdwn(replaceHeadline(activity.display.default))
  const reach = activity.member.reach?.[activity.platform] || activity.member.reach?.total

  const { member } = activity
  const memberProperties = []
  if (member.attributes.jobTitle?.default) {
    memberProperties.push(`*💼 Job title:* ${member.attributes.jobTitle?.default}`)
  }
  if (member.organizations.length > 0) {
    const orgs = member.organizations.map(
      (org) => `<${`${FRONTEND_URL}/organizations/${org.id}`}|${org.name || org.displayName}>`,
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

  if (!buttonPlatforms.includes(activity.platform)) {
    buttonPlatforms = [activity.platform, ...buttonPlatforms]
  }

  const buttonProfiles = buttonPlatforms
    .map((platform) => profiles.find((profile) => profile.platform === platform))
    .filter((profiles) => !!profiles)

  const menuProfiles = profiles.filter((profile) => !buttonPlatforms.includes(profile.platform))

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${FRONTEND_URL}/contacts/${activity.member.id}|${activity.member.displayName}>* *${display.text}*`,
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
                    ? `*${truncateText(htmlToMrkdwn(activity.title).text, 120).replaceAll(
                        '\n',
                        '\n>',
                      )}* \n>`
                    : ''
                }${truncateText(htmlToMrkdwn(activity.body).text, 260).replaceAll('\n', '\n>')}`,
              },
            },
          ]
        : []),
      ...(memberProperties.length > 0
        ? [
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
          ]
        : []),
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
            url: `${FRONTEND_URL}/contacts/${member.id}`,
          },
          ...(buttonProfiles || [])
            .map(({ platform, url }) => ({
              type: 'button',
              text: {
                type: 'plain_text',
                text: `${integrationLabel[platform] ?? platform} profile`,
                emoji: true,
              },
              url,
            }))
            .filter((action) => !!action.url),
          ...(menuProfiles.length > 0
            ? [
                {
                  type: 'overflow',
                  options: menuProfiles.map(({ platform, url }) => ({
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
