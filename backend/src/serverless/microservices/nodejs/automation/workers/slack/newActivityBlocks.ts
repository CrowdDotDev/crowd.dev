import htmlToMrkdwn from 'html-to-mrkdwn-ts'
import {API_CONFIG} from "../../../../../../config"
import {integrationLabel} from "../../../../../../types/integrationEnums"

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

export const newActivityBlocks = (activity) => {
    const display = htmlToMrkdwn(`${activity.display.default}`)
    const reach = activity.member.reach?.[activity.platform] || activity.member.reach?.total
    const memberProperties = []
    if (activity.member.attributes.jobTitle?.default) {
        memberProperties.push(activity.member.attributes.jobTitle?.default)
    }
    if (reach > 0) {
        memberProperties.push(`${reach} followers`)
    }
    const engagementLevel = computeEngagementLevel(activity.member.score)
    if (engagementLevel.length > 0) {
        memberProperties.push(`*Engagement level:* ${engagementLevel}`)
    }
    if (activity.member.username) {
        const platforms = Object.keys(activity.member.username).map((platform) => integrationLabel[platform] || platform).join(' | ')
        memberProperties.push(`*Active on:* ${platforms}`)
    }

    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":satellite_antenna: *New activity*"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*<${API_CONFIG.frontendUrl}/members/${activity.member.id}|${activity.member.displayName}>* \n *${display.text}*`
            },
            ...(activity.url ? {
                "accessory": {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": `:arrow_upper_right: ${activity.platform !== 'other' ? `Open on ${integrationLabel[activity.platform]}` : 'Open link'}`,
                        "emoji": true
                    },
                    "url": activity.url
                }
            } : {})
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": memberProperties.join(' • ')
                }
            ]
        },
        ...(activity.title || activity.body ? [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `${activity.title ? `>*${htmlToMrkdwn(activity.title).text}* \n> ` : ''}${htmlToMrkdwn(activity.body).text}`
            }
        }] : []),
    ]
}
