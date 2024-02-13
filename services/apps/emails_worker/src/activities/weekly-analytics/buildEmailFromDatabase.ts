import lodash from 'lodash'
import moment from 'moment'
import { convert as convertHtmlToText } from 'html-to-text'

import { getEnv } from '@crowd/common'
import {
  ActivityDisplayVariant,
  IMember,
  IOrganization,
  PlatformType,
  SegmentRawData,
} from '@crowd/types'
import { ActivityDisplayService, DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'

import { svc } from '../../main'

import { UserTenant } from '../../types/user'
import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'

import {
  fetchMostActiveMembers,
  fetchSegments,
  fetchTenantUsers,
  fetchMostActiveOrganizations,
  fetchTopActivityTypes,
  fetchConversations,
  fetchConversation,
  fetchFirstActivity,
  fetchRemainingActivities,
  fetchActiveIntegrations,
} from '@crowd/data-access-layer/src/old/apps/emails_worker/tenants'

interface ActivityType {
  totalCount: number
  count: number
  type: string
  platform: string
  percentage: string
  platformIcon: string
}

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

const db = svc.postgres.reader

/*
getSegments is a Temporal activity that returns the tenant's segments.
*/
export async function getSegments(input: InputAnalyticsWithTimes): Promise<SegmentRawData[]> {
  let rows: SegmentRawData[]

  try {
    rows = await fetchSegments(db, input.tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

/*
getTenantUsers is a Temporal activity that returns the tenant's users.
*/
export async function getTenantUsers(input: InputAnalyticsWithTimes): Promise<UserTenant[]> {
  let rows: UserTenant[]

  try {
    rows = await fetchTenantUsers(db, input.tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

/*
getMostActiveMembers is a Temporal activity that returns the tenant's most active
members for the current week.
*/
export async function getMostActiveMembers(input: InputAnalyticsWithSegments): Promise<IMember[]> {
  let members: IMember[]

  try {
    members = await fetchMostActiveMembers(
      db,
      input.tenantId,
      input.dateTimeStartThisWeek,
      input.dateTimeEndThisWeek,
    )
  } catch (err) {
    throw new Error(err)
  }

  members = members.map((m) => {
    if (!m.avatarUrl) {
      m.avatarUrl = `${s3Url}/email/member-placeholder.png`
    }

    return m
  })

  return members
}

/*
getMostActiveOrganizations is a Temporal activity that returns the tenant's most
active organizations for the current week.
*/
export async function getMostActiveOrganizations(
  input: InputAnalyticsWithSegments,
): Promise<IOrganization[]> {
  let orgs: IOrganization[]

  try {
    orgs = await fetchMostActiveOrganizations(
      db,
      input.tenantId,
      input.dateTimeStartThisWeek,
      input.dateTimeEndThisWeek,
    )
  } catch (err) {
    throw new Error(err)
  }

  orgs = orgs.map((o) => {
    if (!o.avatarUrl) {
      o.avatarUrl = `${s3Url}/email/organization-placeholder.png`
    }

    return o
  })

  return orgs
}

/*
getTopActivityTypes is a Temporal activity that returns the tenant's top activity
types for the current week.
*/
export async function getTopActivityTypes(
  input: InputAnalyticsWithSegments,
): Promise<ActivityType[]> {
  let types: ActivityType[]

  try {
    types = await fetchTopActivityTypes(
      db,
      input.tenantId,
      input.dateTimeStartThisWeek,
      input.dateTimeEndThisWeek,
    )
  } catch (err) {
    throw new Error(err)
  }

  types = types.map((a) => {
    const displayOptions = ActivityDisplayService.getDisplayOptions(
      {
        platform: a.platform,
        type: a.type,
      },
      {
        default: DEFAULT_ACTIVITY_TYPE_SETTINGS,
        custom: input.segments.reduce((acc, s) => lodash.merge(acc, s.customActivityTypes), {}),
      },
      [ActivityDisplayVariant.SHORT],
    )
    const prettyName: string = displayOptions.short
    a.type = prettyName[0].toUpperCase() + prettyName.slice(1)
    a.percentage = Number((a.count / a.totalCount) * 100).toFixed(2)
    a.platformIcon = `${s3Url}/email/${a.platform}.png`
    return a
  })

  return types
}

/*
getConversations is a Temporal activity that returns the tenant's conversations
for the current week.
*/
export async function getConversations(input: InputAnalyticsWithSegments): Promise<object[]> {
  let convs: object[]

  try {
    convs = await Promise.all(
      (
        await fetchConversations(
          db,
          input.tenantId,
          input.dateTimeStartThisWeek,
          input.dateTimeEndThisWeek,
        )
      ).map(async (c) => {
        const conversationLazyLoaded = await fetchConversation(db, c.id, c.tenantId, c.segmentId)

        // Populate with the first activity with parent = null.
        const firstActivity = await fetchFirstActivity(db, c.id, c.tenantId, c.segmentId)

        // Fetch remaining activities with parent != null.
        const remainingActivities = await fetchRemainingActivities(
          db,
          c.id,
          c.tenantId,
          c.segmentId,
        )

        conversationLazyLoaded.activities = [...firstActivity, ...remainingActivities]

        const conversationStarterActivity = conversationLazyLoaded.activities[0]
        if (conversationStarterActivity) {
          c.conversationStartedFromNow = moment.utc(conversationStarterActivity.timestamp).fromNow()

          c.platform = conversationStarterActivity.platform
          c.platformIcon = `${s3Url}/email/${conversationStarterActivity.platform}.png`
          c.body = conversationStarterActivity.title
            ? convertHtmlToText(conversationStarterActivity.title)
            : convertHtmlToText(conversationStarterActivity.body)

          const displayOptions = ActivityDisplayService.getDisplayOptions(
            conversationStarterActivity,
            {
              default: DEFAULT_ACTIVITY_TYPE_SETTINGS,
              custom: input.segments.reduce(
                (acc, s) => lodash.merge(acc, s.customActivityTypes),
                {},
              ),
            },
            [ActivityDisplayVariant.SHORT],
          )

          let prettyChannel = conversationStarterActivity.channel
          let prettyChannelHTML = `<span style='text-decoration:none;color:#4B5563'>${prettyChannel}</span>`

          if (conversationStarterActivity.platform === PlatformType.GITHUB) {
            const prettyChannelSplitted = prettyChannel.split('/')
            prettyChannel = prettyChannelSplitted[prettyChannelSplitted.length - 1]
            prettyChannelHTML = `<span style='color:#e94f2e'><a target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#e94f2e;font-size:14px;line-height:14px" href="${conversationStarterActivity.channel}">${prettyChannel}</a></span>`
          }

          c.description = `${displayOptions.short} in ${prettyChannelHTML}`
          c.sourceLink = conversationStarterActivity.url
          c.member = conversationStarterActivity.memberDisplayName
        }

        const replyActivities = conversationLazyLoaded.activities.slice(1)
        c.replyCount = replyActivities.length

        c.memberCount =
          conversationLazyLoaded.activities.reduce((acc, i) => {
            if (!acc.ids) {
              acc.ids = []
              acc.count = 0
            }

            if (!acc.ids[i.memberId]) {
              acc.ids[i.memberId] = true
              acc.count += 1
            }
            return acc
          }, {}).count ?? 0

        return c
      }),
    )
  } catch (err) {
    throw new Error(err)
  }

  return convs
}

/*
getActiveTenantIntegrations is a Temporal activity that returns the tenant's
active integrations, useful to know if it's required to send a weekly email or
not.
*/
export async function getActiveTenantIntegrations(
  input: InputAnalyticsWithSegments,
): Promise<object[]> {
  let integrations: object[]

  try {
    integrations = await fetchActiveIntegrations(db, input.tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return integrations
}
