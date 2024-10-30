import {
  eagleeyeBuildEmailContent,
  eagleeyeFetchFromDatabase,
  eagleeyeFetchFromEagleEye,
} from './activities/eagleeye-digest/buildEmail'
import { eagleeyeGetNextEmails } from './activities/eagleeye-digest/getNextEmails'
import { eagleeyeSendEmail } from './activities/eagleeye-digest/sendEmail'
import { eagleeyeUpdateNextEmailAt } from './activities/eagleeye-digest/updateEmailHistory'
import { updateEmailHistory } from './activities/updateEmailHistory'
import {
  getActiveTenantIntegrations,
  getNewMembersPreviousWeek,
  getNewMembersThisWeek,
  getNewOrganizationsPreviousWeek,
  getNewOrganizationsThisWeek,
  getSegments,
  getTenantUsers,
  getTotalMembersPreviousWeek,
  getTotalMembersThisWeek,
  getTotalOrganizationsPreviousWeek,
  getTotalOrganizationsThisWeek,
} from './activities/weekly-analytics/buildEmailFromPostgreSQL'
import {
  getActiveMembersPreviousWeek,
  getActiveMembersThisWeek,
  getActiveOrganizationsPreviousWeek,
  getActiveOrganizationsThisWeek,
  getConversations,
  getMostActiveMembersThisWeek,
  getMostActiveOrganizationsThisWeek,
  getNewActivitiesPreviousWeek,
  getNewActivitiesThisWeek,
  getTopActivityTypes,
  getTotalActivitiesPreviousWeek,
  getTotalActivitiesThisWeek,
} from './activities/weekly-analytics/buildEmailFromQuestDB'
import { calculateTimes, weeklyGetNextEmails } from './activities/weekly-analytics/getNextEmails'
import { weeklySendEmail } from './activities/weekly-analytics/sendEmail'

export {
  updateEmailHistory,
  eagleeyeGetNextEmails,
  eagleeyeBuildEmailContent,
  eagleeyeUpdateNextEmailAt,
  eagleeyeSendEmail,
  eagleeyeFetchFromDatabase,
  eagleeyeFetchFromEagleEye,
  getTotalMembersThisWeek,
  getTotalMembersPreviousWeek,
  getActiveMembersThisWeek,
  getActiveMembersPreviousWeek,
  getNewMembersThisWeek,
  getNewMembersPreviousWeek,
  getTotalOrganizationsThisWeek,
  getTotalOrganizationsPreviousWeek,
  getActiveOrganizationsThisWeek,
  getActiveOrganizationsPreviousWeek,
  getNewOrganizationsThisWeek,
  getNewOrganizationsPreviousWeek,
  getTotalActivitiesThisWeek,
  getTotalActivitiesPreviousWeek,
  getNewActivitiesThisWeek,
  getNewActivitiesPreviousWeek,
  getTenantUsers,
  getSegments,
  getMostActiveMembersThisWeek,
  getMostActiveOrganizationsThisWeek,
  getTopActivityTypes,
  getConversations,
  getActiveTenantIntegrations,
  weeklyGetNextEmails,
  calculateTimes,
  weeklySendEmail,
}
