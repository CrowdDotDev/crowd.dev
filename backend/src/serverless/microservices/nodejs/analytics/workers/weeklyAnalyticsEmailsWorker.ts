import moment from 'moment'
import { QueryTypes } from 'sequelize'
import { convert as convertHtmlToText } from 'html-to-text'
import getUserContext from '../../../../../database/utils/getUserContext'
import CubeJsService from '../../../../../services/cubejs/cubeJsService'
import EmailSender from '../../../../../services/emailSender'
import ConversationService from '../../../../../services/conversationService'
import { API_CONFIG, SENDGRID_CONFIG, S3_CONFIG } from '../../../../../config'
import CubeJsRepository from '../../../../../cubejs/cubeJsRepository'
import { AnalyticsEmailsOutput } from '../../messageTypes'
import getStage from '../../../../../services/helpers/getStage'
import { s3 } from '../../../../../services/aws'
import UserRepository from '../../../../../database/repositories/userRepository'
import { createServiceChildLogger } from '../../../../../utils/logging'
import { prettyActivityTypes } from '../../../../../types/prettyActivityTypes'
import ConversationRepository from '../../../../../database/repositories/conversationRepository'
import { PlatformType } from '../../../../../types/integrationEnums'

const log = createServiceChildLogger('weeklyAnalyticsEmailsWorker')

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function weeklyAnalyticsEmailsWorker(tenantId: string): Promise<AnalyticsEmailsOutput> {
  log.info(tenantId, `Processing tenant's weekly emails...`)

  const s3Url = `https://${
    S3_CONFIG.microservicesAssetsBucket
  }-${getStage()}.s3.eu-central-1.amazonaws.com`

  const unixEpoch = moment.unix(0)

  const dateTimeEndThisWeek = moment().utc().startOf('isoWeek')
  const dateTimeStartThisWeek = moment().utc().startOf('isoWeek').subtract(7, 'days')

  const dateTimeEndPreviousWeek = dateTimeStartThisWeek.clone()
  const dateTimeStartPreviousWeek = dateTimeStartThisWeek.clone().subtract(7, 'days')

  const userContext = await getUserContext(tenantId)

  if (userContext.currentUser) {
    const cjs = new CubeJsService()
    // tokens should be set for each tenant
    await cjs.setTenant(tenantId)

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
        m.avatarUrl = `/email/member-placeholder.png`
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
       o.name as name,
       o.logo as "avatarUrl"
    from organizations o
      inner join "memberOrganizations" mo on o.id = mo."organizationId"
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
      const prettyName: string = prettyActivityTypes[a.platform][a.type]
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
      ).map(async (c) => {
        const conversationLazyLoaded = await cs.findById(c.id)

        const conversationStarterActivity = conversationLazyLoaded.activities[0]

        c.conversationStartedFromNow = moment(conversationStarterActivity.timestamp).fromNow()

        c.replyCount = conversationLazyLoaded.activities.length - 1

        c.memberCount = await ConversationRepository.getTotalMemberCount(
          conversationLazyLoaded.activities,
        )

        c.platform = conversationStarterActivity.platform

        c.body = conversationStarterActivity.title
          ? convertHtmlToText(conversationStarterActivity.title)
          : convertHtmlToText(conversationStarterActivity.body)

        c.platformIcon = `${s3Url}/email/${conversationStarterActivity.platform}.png`

        let prettyChannel = conversationStarterActivity.channel

        let prettyChannelHTML = `<span style='text-decoration:none;color:#4B5563'>${prettyChannel}</span>`

        if (conversationStarterActivity.platform === PlatformType.GITHUB) {
          const prettyChannelSplitted = prettyChannel.split('/')
          prettyChannel = prettyChannelSplitted[prettyChannelSplitted.length - 1]
          prettyChannelHTML = `<span style='color:#e94f2e'><a target="_blank" style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:none;color:#e94f2e;font-size:14px;line-height:14px" href="${conversationStarterActivity.channel}">${prettyChannel}</a></span>`
        }

        c.description = `${
          prettyActivityTypes[conversationStarterActivity.platform][
            conversationStarterActivity.type
          ]
        } in ${prettyChannelHTML}`

        c.sourceLink = conversationStarterActivity.url

        c.member = conversationStarterActivity.member.username[conversationStarterActivity.platform]

        return c
      }),
    )

    if (activeMembersThisWeek > 0) {
      log.info(tenantId, ` has some active members this week. Eligible for weekly emails.. `)
      const allTenantUsers = await UserRepository.findAllUsersOfTenant(tenantId)

      const advancedSuppressionManager = {
        groupId: parseInt(SENDGRID_CONFIG.weeklyAnalyticsUnsubscribeGroupId, 10),
        groupsToDisplay: [parseInt(SENDGRID_CONFIG.weeklyAnalyticsUnsubscribeGroupId, 10)],
      }

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
                ...getChangeAndDirection(
                  totalOrganizationsThisWeek,
                  totalOrganizationsPreviousWeek,
                ),
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

          log.info(data, 'Sending data to sendgrid.. ')

          await new EmailSender(EmailSender.TEMPLATES.WEEKLY_ANALYTICS, data).sendTo(
            user.email,
            advancedSuppressionManager,
          )

          await new EmailSender(EmailSender.TEMPLATES.WEEKLY_ANALYTICS, data).sendTo(
            'epipav@gmail.com',
            advancedSuppressionManager,
          )
        }
      }

      return { status: 200, emailSent: true }
    }

    return {
      status: 200,
      msg: `Tenant ${tenantId} doesn't have reasonable insights. `,
      emailSent: false,
    }
  }

  return {
    status: 200,
    msg: `Email is not verified for tenant ${tenantId}`,
    emailSent: false,
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
