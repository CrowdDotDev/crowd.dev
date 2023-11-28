import { CubeJsRepository, CubeJsService } from '@crowd/cubejs'
import { ActivityDisplayService } from '@crowd/integrations'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisCache, getRedisClient } from '@crowd/redis'
import { ActivityDisplayVariant, PlatformType } from '@crowd/types'
import { convert as convertHtmlToText } from 'html-to-text'
import moment from 'moment'
import { QueryTypes } from 'sequelize'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import { REDIS_CONFIG, S3_CONFIG, SENDGRID_CONFIG, WEEKLY_EMAILS_CONFIG } from '../../../../../conf'
import ConversationRepository from '../../../../../database/repositories/conversationRepository'
import RecurringEmailsHistoryRepository from '../../../../../database/repositories/recurringEmailsHistoryRepository'
import SegmentRepository from '../../../../../database/repositories/segmentRepository'
import UserRepository from '../../../../../database/repositories/userRepository'
import getUserContext from '../../../../../database/utils/getUserContext'
import ConversationService from '../../../../../services/conversationService'
import EmailSender from '../../../../../services/emailSender'
import getStage from '../../../../../services/helpers/getStage'
import { RecurringEmailType } from '../../../../../types/recurringEmailsHistoryTypes'
import { AnalyticsEmailsOutput } from '../../messageTypes'

const log = getServiceChildLogger('weeklyAnalyticsEmailsWorker')

const MAX_RETRY_COUNT = 5

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function weeklyAnalyticsEmailsWorker(tenantId: string): Promise<AnalyticsEmailsOutput> {
  log.info(tenantId, `Processing tenant's weekly emails...`)
  const response = await getAnalyticsData(tenantId)
  const userContext = await getUserContext(tenantId)

  if (response.shouldRetry) {
    if (WEEKLY_EMAILS_CONFIG.enabled !== 'true') {
      log.info(`Weekly emails are disabled. Not retrying.`)

      return {
        status: 200,
        msg: `Weekly emails are disabled. Not retrying.`,
        emailSent: false,
      }
    }

    log.error(
      response.error,
      'Exception while getting analytics data. Retrying with a new message.',
    )

    // expception while getting data. send new node message and return
    const emitter = await getNodejsWorkerEmitter()
    await emitter.weeklyAnalyticsEmail(tenantId)

    return {
      status: 400,
      msg: `Exception while getting analytics data. Retrying with a new mq message.`,
      emailSent: false,
    }
  }

  if (!userContext.currentUser) {
    const message = `Tenant(${tenantId}) doesn't have any active users.`
    log.info(message)
    return {
      status: 200,
      msg: message,
      emailSent: false,
    }
  }

  const {
    dateTimeStartThisWeek,
    dateTimeEndThisWeek,
    totalMembersThisWeek,
    totalMembersPreviousWeek,
    activeMembersThisWeek,
    activeMembersPreviousWeek,
    newMembersThisWeek,
    newMembersPreviousWeek,
    mostActiveMembers,
    totalOrganizationsThisWeek,
    totalOrganizationsPreviousWeek,
    activeOrganizationsThisWeek,
    activeOrganizationsPreviousWeek,
    newOrganizationsThisWeek,
    newOrganizationsPreviousWeek,
    mostActiveOrganizations,
    totalActivitiesThisWeek,
    totalActivitiesPreviousWeek,
    newActivitiesThisWeek,
    newActivitiesPreviousWeek,
    topActivityTypes,
    conversations,
    activeTenantIntegrations,
  } = response.data as any

  const rehRepository = new RecurringEmailsHistoryRepository(userContext)

  const isEmailAlreadySent =
    (await rehRepository.findByWeekOfYear(
      tenantId,
      moment().utc().startOf('isoWeek').subtract(7, 'days').isoWeek().toString(),
      RecurringEmailType.WEEKLY_ANALYTICS,
    )) !== null

  if (activeTenantIntegrations.length > 0 && !isEmailAlreadySent) {
    log.info(tenantId, ` has completed integrations. Eligible for weekly emails.. `)
    const allTenantUsers = await UserRepository.findAllUsersOfTenant(tenantId)

    const advancedSuppressionManager = {
      groupId: parseInt(SENDGRID_CONFIG.weeklyAnalyticsUnsubscribeGroupId, 10),
      groupsToDisplay: [parseInt(SENDGRID_CONFIG.weeklyAnalyticsUnsubscribeGroupId, 10)],
    }

    const emailSentTo: string[] = []

    for (const user of allTenantUsers) {
      if (user.email && user.emailVerified) {
        const userFirstName = user.firstName ? user.firstName : user.email.split('@')[0]

        const data = {
          dateRangePretty: `${dateTimeStartThisWeek.format(
            'D MMM YYYY',
          )} - ${dateTimeEndThisWeek.format('D MMM YYYY')}`,
          members: {
            total: {
              value: totalMembersThisWeek,
              ...getChangeAndDirection(totalMembersThisWeek, totalMembersPreviousWeek),
            },
            new: {
              value: newMembersThisWeek,
              ...getChangeAndDirection(newMembersThisWeek, newMembersPreviousWeek),
            },
            active: {
              value: activeMembersThisWeek,
              ...getChangeAndDirection(activeMembersThisWeek, activeMembersPreviousWeek),
            },
            mostActive: mostActiveMembers,
          },
          organizations: {
            total: {
              value: totalOrganizationsThisWeek,
              ...getChangeAndDirection(totalOrganizationsThisWeek, totalOrganizationsPreviousWeek),
            },
            new: {
              value: newOrganizationsThisWeek,
              ...getChangeAndDirection(newOrganizationsThisWeek, newOrganizationsPreviousWeek),
            },
            active: {
              value: activeOrganizationsThisWeek,
              ...getChangeAndDirection(
                activeOrganizationsThisWeek,
                activeOrganizationsPreviousWeek,
              ),
            },
            mostActive: mostActiveOrganizations,
          },
          activities: {
            total: {
              value: totalActivitiesThisWeek,
              ...getChangeAndDirection(totalActivitiesThisWeek, totalActivitiesPreviousWeek),
            },
            new: {
              value: newActivitiesThisWeek,
              ...getChangeAndDirection(newActivitiesThisWeek, newActivitiesPreviousWeek),
            },
            topActivityTypes,
          },
          conversations,
          tenant: {
            name: userContext.currentTenant.name,
          },
          user: {
            name: userFirstName,
          },
        }

        await new EmailSender(EmailSender.TEMPLATES.WEEKLY_ANALYTICS, data).sendTo(
          user.email,
          advancedSuppressionManager,
        )

        await new EmailSender(EmailSender.TEMPLATES.WEEKLY_ANALYTICS, data).sendTo(
          'team@crowd.dev',
          advancedSuppressionManager,
        )

        emailSentTo.push(user.email)
      }
    }

    const reHistory = await rehRepository.create({
      tenantId,
      type: RecurringEmailType.WEEKLY_ANALYTICS,
      weekOfYear: dateTimeStartThisWeek.isoWeek().toString(),
      emailSentAt: moment().toISOString(),
      emailSentTo,
    })

    log.info({ receipt: reHistory }, `Email sent!`)

    return { status: 200, emailSent: true }
  }

  if (isEmailAlreadySent) {
    log.warn({ tenantId }, 'E-mail is already sent for this tenant this week. Skipping!')
  } else {
    log.info({ tenantId }, 'No active integrations present in the tenant. Email will not be sent.')
  }

  return {
    status: 200,
    msg: `No active integrations present in the tenant. Email will not be sent.`,
    emailSent: false,
  }
}

async function getAnalyticsData(tenantId: string) {
  try {
    const s3Url = `https://${
      S3_CONFIG.microservicesAssetsBucket
    }-${getStage()}.s3.eu-central-1.amazonaws.com`

    const unixEpoch = moment.unix(0)

    const dateTimeEndThisWeek = moment().utc().startOf('isoWeek')
    const dateTimeStartThisWeek = moment().utc().startOf('isoWeek').subtract(7, 'days')

    const dateTimeEndPreviousWeek = dateTimeStartThisWeek.clone()
    const dateTimeStartPreviousWeek = dateTimeStartThisWeek.clone().subtract(7, 'days')

    const userContext = await getUserContext(tenantId)

    const cjs = new CubeJsService()
    const segmentRepository = new SegmentRepository(userContext)
    const subprojects = await segmentRepository.querySubprojects({})
    const segmentIds = subprojects.rows.map((subproject) => subproject.id)
    // tokens should be set for each tenant
    await cjs.init(tenantId, segmentIds)

    // members
    const totalMembersThisWeek = await CubeJsRepository.getNewMembers(
      cjs,
      unixEpoch,
      dateTimeEndThisWeek,
    )

    const totalMembersPreviousWeek = await CubeJsRepository.getNewMembers(
      cjs,
      unixEpoch,
      dateTimeEndPreviousWeek,
    )

    const activeMembersThisWeek = await CubeJsRepository.getActiveMembers(
      cjs,
      dateTimeStartThisWeek,
      dateTimeEndThisWeek,
    )
    const activeMembersPreviousWeek = await CubeJsRepository.getActiveMembers(
      cjs,
      dateTimeStartPreviousWeek,
      dateTimeEndPreviousWeek,
    )

    const newMembersThisWeek = await CubeJsRepository.getNewMembers(
      cjs,
      dateTimeStartThisWeek,
      dateTimeEndThisWeek,
    )
    const newMembersPreviousWeek = await CubeJsRepository.getNewMembers(
      cjs,
      dateTimeStartPreviousWeek,
      dateTimeEndPreviousWeek,
    )

    const mostActiveMembers = (
      await userContext.database.sequelize.query(
        `
      select 
        count(a.id) as "activityCount",
        m."displayName" as name,
        m.attributes->'avatarUrl'->>'default' as "avatarUrl"
      from members m
      inner join activities a on m.id = a."memberId"
      where m."tenantId" = :tenantId
        and a.timestamp between :startDate and :endDate
        and coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean is false
        and coalesce(m.attributes->'isBot'->>'default', 'false')::boolean is false
      group by m.id
      order by count(a.id) desc
      limit 5;`,
        {
          replacements: {
            tenantId,
            startDate: dateTimeStartThisWeek.toISOString(),
            endDate: dateTimeEndThisWeek.toISOString(),
          },
          type: QueryTypes.SELECT,
        },
      )
    ).map((m) => {
      if (!m.avatarUrl) {
        m.avatarUrl = `${s3Url}/email/member-placeholder.png`
      }
      return m
    })

    // organizations
    const totalOrganizationsThisWeek = await CubeJsRepository.getNewOrganizations(
      cjs,
      unixEpoch,
      dateTimeEndThisWeek,
    )
    const totalOrganizationsPreviousWeek = await CubeJsRepository.getNewOrganizations(
      cjs,
      unixEpoch,
      dateTimeEndPreviousWeek,
    )

    const activeOrganizationsThisWeek = await CubeJsRepository.getActiveOrganizations(
      cjs,
      dateTimeStartThisWeek,
      dateTimeEndThisWeek,
    )
    const activeOrganizationsPreviousWeek = await CubeJsRepository.getActiveOrganizations(
      cjs,
      dateTimeStartPreviousWeek,
      dateTimeEndPreviousWeek,
    )

    const newOrganizationsThisWeek = await CubeJsRepository.getNewOrganizations(
      cjs,
      dateTimeStartThisWeek,
      dateTimeEndThisWeek,
    )
    const newOrganizationsPreviousWeek = await CubeJsRepository.getNewOrganizations(
      cjs,
      dateTimeStartPreviousWeek,
      dateTimeEndPreviousWeek,
    )

    const mostActiveOrganizations = (
      await userContext.database.sequelize.query(
        `
      select count(a.id) as "activityCount",
         o."displayName" as name,
         o.logo as "avatarUrl"
      from organizations o
        inner join "memberOrganizations" mo
          on o.id = mo."organizationId"
          and mo."deletedAt" is null
        inner join members m on mo."memberId" = m.id
        inner join activities a on m.id = a."memberId"
      where m."tenantId" = :tenantId
        and a.timestamp between :startDate and :endDate
        and coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean is false
        and coalesce(m.attributes->'isBot'->>'default', 'false')::boolean is false
      group by o.id
      order by count(a.id) desc
      limit 5;`,
        {
          replacements: {
            tenantId,
            startDate: dateTimeStartThisWeek.toISOString(),
            endDate: dateTimeEndThisWeek.toISOString(),
          },
          type: QueryTypes.SELECT,
        },
      )
    ).map((o) => {
      if (!o.avatarUrl) {
        o.avatarUrl = `${s3Url}/email/organization-placeholder.png`
      }
      return o
    })

    // activities
    const totalActivitiesThisWeek = await CubeJsRepository.getNewActivities(
      cjs,
      unixEpoch,
      dateTimeEndThisWeek,
    )
    const totalActivitiesPreviousWeek = await CubeJsRepository.getNewActivities(
      cjs,
      unixEpoch,
      dateTimeEndPreviousWeek,
    )

    const newActivitiesThisWeek = await CubeJsRepository.getNewActivities(
      cjs,
      dateTimeStartThisWeek,
      dateTimeEndThisWeek,
    )
    const newActivitiesPreviousWeek = await CubeJsRepository.getNewActivities(
      cjs,
      dateTimeStartPreviousWeek,
      dateTimeEndPreviousWeek,
    )

    let topActivityTypes = await userContext.database.sequelize.query(
      `
      select sum(count(*)) OVER () as "totalCount",
         count(*)              as count,
         a.type,
         a.platform
      from activities a
      where a."tenantId" = :tenantId
        and a.timestamp between :startDate and :endDate
      group by a.type, a.platform
      order by count(*) desc
      limit 5;`,
      {
        replacements: {
          tenantId,
          startDate: dateTimeStartThisWeek.toISOString(),
          endDate: dateTimeEndThisWeek.toISOString(),
        },
        type: QueryTypes.SELECT,
      },
    )

    topActivityTypes = topActivityTypes.map((a) => {
      const displayOptions = ActivityDisplayService.getDisplayOptions(
        {
          platform: a.platform,
          type: a.type,
        },
        SegmentRepository.getActivityTypes(userContext),
        [ActivityDisplayVariant.SHORT],
      )
      const prettyName: string = displayOptions.short
      a.type = prettyName[0].toUpperCase() + prettyName.slice(1)
      a.percentage = Number((a.count / a.totalCount) * 100).toFixed(2)
      a.platformIcon = `${s3Url}/email/${a.platform}.png`
      return a
    })

    // conversations
    const cs = new ConversationService(userContext)

    const conversations = await Promise.all(
      (
        await userContext.database.sequelize.query(
          `
      select
          c.id
      from conversations c
          join activities a on a."conversationId" = c.id
      where a."tenantId" = :tenantId
        and a.timestamp between :startDate and :endDate
      group by c.id
      order by count(a.id) desc
      limit 3;`,
          {
            replacements: {
              tenantId,
              startDate: dateTimeStartThisWeek.toISOString(),
              endDate: dateTimeEndThisWeek.toISOString(),
            },
            type: QueryTypes.SELECT,
          },
        )
      ).map(async (c) => {
        const conversationLazyLoaded = await cs.findById(c.id)

        const conversationStarterActivity = conversationLazyLoaded.activities[0]

        c.conversationStartedFromNow = moment(conversationStarterActivity.timestamp).fromNow()

        const replyActivities = conversationLazyLoaded.activities.slice(1)

        c.replyCount = replyActivities.length

        c.memberCount = await ConversationRepository.getTotalMemberCount(replyActivities)

        c.platform = conversationStarterActivity.platform

        c.body = conversationStarterActivity.title
          ? convertHtmlToText(conversationStarterActivity.title)
          : convertHtmlToText(conversationStarterActivity.body)

        c.platformIcon = `${s3Url}/email/${conversationStarterActivity.platform}.png`

        const displayOptions = ActivityDisplayService.getDisplayOptions(
          conversationStarterActivity,
          SegmentRepository.getActivityTypes(userContext),
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

        c.member = conversationStarterActivity.member.displayName

        return c
      }),
    )

    const activeTenantIntegrations = await userContext.database.sequelize.query(
      `
        select * from integrations i
        where i."tenantId" = :tenantId
        and i.status = 'done'
        and i."deletedAt" is null
        limit 1;`,
      {
        replacements: {
          tenantId,
        },
        type: QueryTypes.SELECT,
      },
    )

    return {
      shouldRetry: false,
      data: {
        dateTimeStartThisWeek,
        dateTimeEndThisWeek,
        dateTimeStartPreviousWeek,
        dateTimeEndPreviousWeek,
        totalMembersThisWeek,
        totalMembersPreviousWeek,
        activeMembersThisWeek,
        activeMembersPreviousWeek,
        newMembersThisWeek,
        newMembersPreviousWeek,
        mostActiveMembers,
        totalOrganizationsThisWeek,
        totalOrganizationsPreviousWeek,
        activeOrganizationsThisWeek,
        activeOrganizationsPreviousWeek,
        newOrganizationsThisWeek,
        newOrganizationsPreviousWeek,
        mostActiveOrganizations,
        totalActivitiesThisWeek,
        totalActivitiesPreviousWeek,
        newActivitiesThisWeek,
        newActivitiesPreviousWeek,
        topActivityTypes,
        conversations,
        activeTenantIntegrations,
      },
    }
  } catch (e) {
    // check redis for retry count
    const redis = await getRedisClient(REDIS_CONFIG, true)
    const weeklyEmailsRetryCountsCache = new RedisCache('weeklyEmailsRetryCounts', redis, log)
    const retryCount = await weeklyEmailsRetryCountsCache.get(tenantId)

    if (!retryCount) {
      weeklyEmailsRetryCountsCache.set(tenantId, '0', 432000) // set the ttl for 5 days
      return {
        shouldRetry: true,
        data: {},
        error: e,
      }
    }

    const parsedRetryCount = parseInt(retryCount, 10)
    if (parsedRetryCount < MAX_RETRY_COUNT) {
      log.info(`Current retryCount for tenant is: ${retryCount}, trying to send the e-mail again!`)
      // increase retryCount and retry the email
      weeklyEmailsRetryCountsCache.set(tenantId, (parsedRetryCount + 1).toString(), 432000)
      return {
        shouldRetry: true,
        data: {},
        error: e,
      }
    }

    log.info(
      { error: JSON.stringify(e) },
      `Retried total of ${MAX_RETRY_COUNT} times. Skipping sending e-mail!`,
    )
    return {
      shouldRetry: false,
      data: {},
      error: e,
    }
  }
}

function getChangeAndDirection(thisWeekValue: number, previousWeekValue: number) {
  let changeAndDirection

  if (thisWeekValue > previousWeekValue) {
    changeAndDirection = {
      changeVsLastWeek: thisWeekValue - previousWeekValue,
      changeVsLastWeekPercentage: Number(
        ((thisWeekValue - previousWeekValue) / thisWeekValue) * 100,
      ).toFixed(2),
      changeVsLastWeekDerivative: 'increasing',
    }
  } else if (thisWeekValue === previousWeekValue) {
    changeAndDirection = {
      changeVsLastWeek: 0,
      changeVsLastWeekPercentage: 0,
      changeVsLastWeekDerivative: 'equal',
    }
  } else {
    changeAndDirection = {
      changeVsLastWeek: previousWeekValue - thisWeekValue,
      changeVsLastWeekPercentage: Number(
        ((previousWeekValue - thisWeekValue) / previousWeekValue) * 100,
      ).toFixed(2),
      changeVsLastWeekDerivative: 'decreasing',
    }
  }

  return changeAndDirection
}

export { weeklyAnalyticsEmailsWorker }
