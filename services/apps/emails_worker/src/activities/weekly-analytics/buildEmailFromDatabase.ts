import lodash from 'lodash'
import moment from 'moment'
import { convert as convertHtmlToText } from 'html-to-text'

import { ActivityDisplayVariant, PlatformType } from '@crowd/types'
import { ActivityDisplayService } from '@crowd/integrations'

import { svc } from '../../main'

import getStage from '../../../../../../backend/src/services/helpers/getStage'
import { SegmentRawData } from '../../../../../../backend/src/types/segmentTypes'

import { UserTenant } from '../../types/user'
import { InputAnalyticsWithSegments, InputAnalyticsWithTimes } from '../../types/analytics'

interface Member {
  activityCount: number
  name: string
  avatarUrl: string
}

interface Organization {
  activityCount: number
  name: string
  avatarUrl: string
}

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
}-${getStage()}.s3.eu-central-1.amazonaws.com`

/*
getSegments is a Temporal activity that returns the tenant's segments.
*/
export async function getSegments(input: InputAnalyticsWithTimes): Promise<SegmentRawData[]> {
  let rows: SegmentRawData[]

  try {
    rows = await svc.postgres.reader.connection().query(
      `SELECT
      s.*
    FROM segments s
    WHERE s."grandparentSlug" IS NOT NULL
      AND s."parentSlug" IS NOT NULL
      AND s."tenantId" = $1
    ORDER BY s.name;`,
      [input.tenantId],
    )
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
    rows = await svc.postgres.reader.connection().query(
      `SELECT tu."tenantId", tu."userId", u.email, u."firstName"
    FROM "tenantUsers" tu
    INNER JOIN users u ON tu."userId" = u.id
    WHERE tu."tenantId" = $1
      AND tu."status" = 'active'
      AND tu."deletedAt" IS NULL
      AND u."emailVerified" IS TRUE
      AND u."deletedAt" IS NULL;`,
      [input.tenantId],
    )
  } catch (err) {
    throw new Error(err)
  }

  return rows
}

/*
getMostActiveMembers is a Temporal activity that returns the tenant's most active
members for the current week.
*/
export async function getMostActiveMembers(input: InputAnalyticsWithSegments): Promise<Member[]> {
  let members: Member[]

  try {
    members = await svc.postgres.reader.connection().query(
      `select 
    count(a.id) as "activityCount",
    m."displayName" as name,
    m.attributes->'avatarUrl'->>'default' as "avatarUrl"
    from members m
    inner join activities a on m.id = a."memberId"
    where m."tenantId" = $1
    and a.timestamp between $2 and $3
    and coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean is false
    and coalesce(m.attributes->'isBot'->>'default', 'false')::boolean is false
    group by m.id
    order by count(a.id) desc
    limit 5;`,
      [
        input.tenantId,
        input.dateTimeStartThisWeek.toISOString(),
        input.dateTimeEndThisWeek.toISOString(),
      ],
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
): Promise<Organization[]> {
  let orgs: Organization[]

  try {
    orgs = await svc.postgres.reader.connection().query(
      `select count(a.id) as "activityCount",
      o.name as name,
      o.logo as "avatarUrl"
    from organizations o
    inner join "memberOrganizations" mo
      on o.id = mo."organizationId"
      and mo."deletedAt" is null
    inner join members m on mo."memberId" = m.id
    inner join activities a on m.id = a."memberId"
    where m."tenantId" = $1
    and a.timestamp between $2 and $3
    and coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean is false
    and coalesce(m.attributes->'isBot'->>'default', 'false')::boolean is false
    group by o.id
    order by count(a.id) desc
    limit 5;`,
      [
        input.tenantId,
        input.dateTimeStartThisWeek.toISOString(),
        input.dateTimeEndThisWeek.toISOString(),
      ],
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
    types = await svc.postgres.reader.connection().query(
      `select sum(count(*)) OVER () as "totalCount",
      count(*) as count,
      a.type,
      a.platform
    from activities a
    where a."tenantId" = $1
    and a.timestamp between $2 and $3
    group by a.type, a.platform
    order by count(*) desc
    limit 5;`,
      [
        input.tenantId,
        input.dateTimeStartThisWeek.toISOString(),
        input.dateTimeEndThisWeek.toISOString(),
      ],
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
      input.segments.reduce((acc, s) => lodash.merge(acc, s.customActivityTypes), {}),
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
        await svc.postgres.reader.connection().query(
          `select
      c.id
    from conversations c
      join activities a on a."conversationId" = c.id
    where a."tenantId" = $1
    and a.timestamp between $2 and $3
    group by c.id
    order by count(a.id) desc
    limit 3;`,
          [
            input.tenantId,
            input.dateTimeStartThisWeek.toISOString(),
            input.dateTimeEndThisWeek.toISOString(),
          ],
        )
      ).map(async (c) => {
        const conversationLazyLoaded = await svc.postgres.reader.connection().query(
          `SELECT * FROM conversations
          WHERE id = $1 AND tenantId = $2 AND segmentId = $3
          LIMIT 1;
        `,
          [c.id, c.tenantId, c.segmentId],
        )

        // Populate with the first activity with parent = null.
        const firstActivity = await svc.postgres.reader.connection().query(
          `SELECT activities.*, members."displayName" AS "memberDisplayName"
          FROM activities
          INNER JOIN members ON activities."memberId" = members.id
          WHERE activities."conversationId" = $1
          AND activities."tenantId" = $2
          AND activities."segmentId" = $3
          AND activities."parentId" IS NULL
          ORDER BY activities."timestamp" ASC, activities."createdAt" ASC
          LIMIT 1;`,
          [c.id, c.tenantId, c.segmentId],
        )

        // Fetch remaining activities with parent != null.
        const remainingActivities = await svc.postgres.reader.connection().query(
          `SELECT * FROM activities
          WHERE "conversationId" = $1
          AND "tenantId" = $2
          AND "segmentId" = $3
          AND "parentId" IS NOT NULL
          ORDER BY "timestamp" ASC, "createdAt" ASC;`,
          [c.id, c.tenantId, c.segmentId],
        )

        conversationLazyLoaded.activities = [...firstActivity, ...remainingActivities]

        const conversationStarterActivity = conversationLazyLoaded.activities[0]
        c.conversationStartedFromNow = moment(conversationStarterActivity.timestamp).fromNow()

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

        c.platform = conversationStarterActivity.platform
        c.platformIcon = `${s3Url}/email/${conversationStarterActivity.platform}.png`
        c.body = conversationStarterActivity.title
          ? convertHtmlToText(conversationStarterActivity.title)
          : convertHtmlToText(conversationStarterActivity.body)

        const displayOptions = ActivityDisplayService.getDisplayOptions(
          conversationStarterActivity,
          input.segments.reduce((acc, s) => lodash.merge(acc, s.customActivityTypes), {}),
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
    integrations = await svc.postgres.reader.connection().query(
      `select * from integrations i
    where i."tenantId" = $1
    and i.status = 'done'
    and i."deletedAt" is null
    limit 1;`,
      [input.tenantId],
    )
  } catch (err) {
    throw new Error(err)
  }

  return integrations
}
