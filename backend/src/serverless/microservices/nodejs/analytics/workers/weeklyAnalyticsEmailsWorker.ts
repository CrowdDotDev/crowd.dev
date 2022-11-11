import moment from 'moment'
import { convert as convertHtmlToText } from 'html-to-text'
import getUserContext from '../../../../../database/utils/getUserContext'
import CubeJsService from '../../../../../services/cubejs/cubeJsService'
import EmailSender from '../../../../../services/emailSender'
import ConversationService from '../../../../../services/conversationService'
import { API_CONFIG, SENDGRID_CONFIG, S3_CONFIG } from '../../../../../config'
import CubeJsRepository from '../../../../../cubejs/cubeJsRepository'
import { AnalyticsEmailsOutput } from '../../messageTypes'
import { platformDisplayNames } from '../../../../../types/platformDisplayNames'
import getStage from '../../../../../services/helpers/getStage'
import { s3 } from '../../../../../services/aws'
import UserRepository from '../../../../../database/repositories/userRepository'
import { createServiceChildLogger } from '../../../../../utils/logging'

const log = createServiceChildLogger('weeklyAnalyticsEmailsWorker')

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function weeklyAnalyticsEmailsWorker(tenantId: string): Promise<AnalyticsEmailsOutput> {
  const dateTimeEnd = moment().utc().startOf('isoWeek')

  const dateTimeStart = moment().utc().startOf('isoWeek').subtract(7, 'days')

  const userContext = await getUserContext(tenantId)

  if (userContext.currentUser) {
    const cjs = new CubeJsService()
    // tokens should be set for each tenant
    await cjs.setTenant(tenantId)

    const newMembers = await CubeJsRepository.getNewMembers(cjs, dateTimeStart, dateTimeEnd)
    const activeMembers = await CubeJsRepository.getActiveMembers(cjs, dateTimeStart, dateTimeEnd)
    const newActivities = await CubeJsRepository.getNewActivities(cjs, dateTimeStart, dateTimeEnd)
    const newConversations = await CubeJsRepository.getNewConversations(
      cjs,
      dateTimeStart,
      dateTimeEnd,
    )

    const conversationService = new ConversationService(userContext)

    const hotConversations = await Promise.all(
      (
        await conversationService.findAndCountAll({
          filter: {
            lastActiveRange: [dateTimeStart.toISOString(), moment().utc().toISOString()],
          },
          limit: 3,
          orderBy: 'activityCount_DESC',
        })
      ).rows.map(async (c) => {
        c.link = `${API_CONFIG.frontendUrl}/conversations/${c.id}`

        c.platformIconExists = await platformIconExists(c.platform)
        c.platformPretty = platformDisplayNames[c.platform]

        const conversationLazyLoaded = await conversationService.findById(c.id)

        c.lastActivity =
          conversationLazyLoaded.activities[conversationLazyLoaded.activities.length - 1]
        c.lastActivity.username = c.lastActivity.member.username[c.platform]

        if (c.lastActivity.body) {
          c.lastActivity.body = convertHtmlToText(c.lastActivity.body)
        }

        c.lastActiveFromNow = moment(c.lastActive).fromNow()
        c.replyCount = conversationLazyLoaded.activities.length - 1
        c.memberCount = conversationLazyLoaded.activities.reduce((acc, i) => {
          if (!acc.ids) {
            acc.ids = []
            acc.count = 0
          }

          if (!acc.ids[i.memberId]) {
            acc.ids[i.memberId] = true
            acc.count += 1
          }
          return acc
        }, {}).count

        return c
      }),
    )

    if (hasReasonableInsights({ newMembers, activeMembers, newActivities, newConversations })) {
      const allTenantUsers = await UserRepository.findAllUsersOfTenant(tenantId)

      const advancedSuppressionManager = {
        groupId: parseInt(SENDGRID_CONFIG.weeklyAnalyticsUnsubscribeGroupId, 10),
        groupsToDisplay: [parseInt(SENDGRID_CONFIG.weeklyAnalyticsUnsubscribeGroupId, 10)],
      }

      for (const user of allTenantUsers) {
        if (user.email && user.emailVerified) {
          const userFirstName = user.firstName ? user.firstName : user.email.split('@')[0]

          const data = {
            analytics: {
              dateRangeStart: dateTimeStart.format('D MMMM, YYYY'),
              dateRangeEnd: dateTimeEnd.format('D MMMM, YYYY'),
              activeMembers,
              newMembers,
              activitiesTracked: newActivities,
              conversationsStarted: newConversations,
              hotConversations,
              hasHotConversations: hotConversations.length > 0,
              hotConversationsCount: hotConversations.length,
            },
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

/**
 * If any of the measures have a value other than zero, returns true
 * Example analyticsDataObject:
 * {
 *    newMembers: '5',
 *    activeMembers: '0',
 *    newActivities: '10',
 *    newConversations: '0'
 * }
 * @param analyticsData
 * @returns
 */
function hasReasonableInsights(analyticsData: any): boolean {
  let hasInsight = false

  for (const measure in analyticsData) {
    if (Object.prototype.hasOwnProperty.call(analyticsData, measure)) {
      hasInsight = hasInsight || (analyticsData[measure] && analyticsData[measure] > 0)
    }
  }

  return hasInsight
}

/**
 * Checks if the icon of a platform exists
 * in s3 assets bucket.
 * Icons will not be rendered if this function
 * returns false.
 *
 * @param platform
 * @returns the existence of icon
 */
async function platformIconExists(platform: string): Promise<boolean> {
  try {
    await s3
      .headObject({
        Bucket: `${S3_CONFIG.microservicesAssetsBucket}-${getStage()}`,
        Key: `email/${platform}.png`,
      })
      .promise()
    return true
  } catch (error) {
    // If there are access problems to bucket, or bucket doesn't exist, or file doesn't exist
    log.error(error, { platform }, 'Error checking if platform icon exists!')
    return false
  }
}

export { weeklyAnalyticsEmailsWorker }
