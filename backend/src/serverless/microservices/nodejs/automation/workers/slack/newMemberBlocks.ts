import { integrationLabel } from '@crowd/types'
import { API_CONFIG } from '../../../../../../conf'

export const newMemberBlocks = (member) => {
  const platforms = member.activeOn
  const reach = platforms && platforms.length > 0 ? member.reach?.[platforms[0]] : member.reach?.total
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':tada: *New member*',
        },
      },
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
      ...(member.attributes.jobTitle?.default
        ? [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Title/Role:*',
                },
                {
                  type: 'mrkdwn',
                  text: member.attributes.jobTitle?.default || '-',
                },
              ],
            },
            {
              type: 'divider',
            },
          ]
        : []),
      ...(member.organizations.length > 0
        ? [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Organization:*',
                },
                {
                  type: 'mrkdwn',
                  text: `<${`${API_CONFIG.frontendUrl}/organizations/${member.organizations[0].id}`}|${
                    member.organizations[0].name
                  }>`,
                },
              ],
            },
            {
              type: 'divider',
            },
          ]
        : []),
      ...(reach > 0
        ? [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Followers:*',
                },
                {
                  type: 'mrkdwn',
                  text: reach > 0 ? `${reach}` : '-',
                },
              ],
            },
            {
              type: 'divider',
            },
          ]
        : []),
      ...(member.attributes?.location?.default
        ? [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Location:*',
                },
                {
                  type: 'mrkdwn',
                  text: member.attributes?.location?.default || '-',
                },
              ],
            },
            {
              type: 'divider',
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
            url: `${API_CONFIG.frontendUrl}/members/${member.id}`,
          },
          ...(platforms || [])
            .map((platform) => ({
              type: 'button',
              text: {
                type: 'plain_text',
                text: `View ${integrationLabel[platform]} profile`,
                emoji: true,
              },
              url: member.attributes?.url?.[platform],
            }))
            .filter((action) => !!action.url),
        ],
      },
    ],
  }
}
