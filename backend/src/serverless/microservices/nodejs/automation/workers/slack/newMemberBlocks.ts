import { integrationLabel, integrationProfileUrl } from '@crowd/types'
import { API_CONFIG } from '../../../../../../conf'

const defaultAvatarUrl =
  'https://uploads-ssl.webflow.com/635150609746eee5c60c4aac/6502afc9d75946873c1efa93_image%20(292).png'

export const newMemberBlocks = (member) => {
  const platforms = member.activeOn
  const reach =
    platforms && platforms.length > 0 ? member.reach?.[platforms[0]] : member.reach?.total
  const details = []
  if (member.attributes.jobTitle?.default) {
    details.push(`*💼 Job title:* ${member.attributes.jobTitle?.default}`)
  }
  if (member.organizations.length > 0) {
    const orgs = member.organizations.map(
      (org) =>
        `<${`${API_CONFIG.frontendUrl}/organizations/${org.id}`}|${org.name || org.displayName}>`,
    )
    details.push(`*🏢 Organization:* ${orgs.join(' | ')}`)
  }
  if (reach > 0) {
    details.push(`*👥 Reach:* ${reach} followers`)
  }
  if (member.attributes?.location?.default) {
    details.push(`*📍 Location:* ${member.attributes?.location?.default}`)
  }
  if (member.emails.length > 0) {
    const [email] = member.emails
    details.push(`*✉️ Email:* <mailto:${email}|${email}>`)
  }
  const profiles = Object.keys(member.username)
    .filter((p) => !platforms.includes(p))
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
        type: 'header',
        text: {
          type: 'plain_text',
          text: member.displayName,
          emoji: true,
        },
      },
      ...(platforms && platforms.length > 0
        ? [
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Joined your community on *${
                    integrationLabel[platforms[0]] || platforms[0]
                  }*`,
                },
              ],
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
          text: details.length > 0 ? details.join('\n') : '\n',
        },
        accessory: {
          type: 'image',
          image_url: member.attributes?.avatarUrl?.default ?? defaultAvatarUrl,
          alt_text: 'computer thumbnail',
        },
      },
      {
        type: 'divider',
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
          ...(platforms || [])
            .map((platform) => ({
              type: 'button',
              text: {
                type: 'plain_text',
                text: `${integrationLabel[platform] ?? platform} profile`,
                emoji: true,
              },
              url: member.attributes?.url?.[platform],
            }))
            .filter((action) => !!action.url),
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
