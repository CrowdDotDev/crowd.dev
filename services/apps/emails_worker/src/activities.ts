import { updateEmailHistory } from './activities/updateEmailHistory'

import { eagleeyeGetNextEmails } from './activities/eagleeye-digest/getNextEmails'
import { eagleeyeSendEmail } from './activities/eagleeye-digest/sendEmail'
import { eagleeyeUpdateNextEmailAt } from './activities/eagleeye-digest/updateEmailHistory'
import {
  eagleeyeBuildEmailContent,
  eagleeyeFetchFromDatabase,
  eagleeyeFetchFromEagleEye,
} from './activities/eagleeye-digest/buildEmail'

import { weeklyGetNextEmails, calculateTimes } from './activities/weekly-analytics/getNextEmails'
import { weeklySendEmail } from './activities/weekly-analytics/sendEmail'

import {
  getTenantUsers,
  getSegments,
  getActiveTenantIntegrations,
  getTotalMembersThisWeek,
  getTotalMembersPreviousWeek,
  getNewMembersThisWeek,
  getNewMembersPreviousWeek,
  getTotalOrganizationsThisWeek,
  getTotalOrganizationsPreviousWeek,
  getNewOrganizationsThisWeek,
  getNewOrganizationsPreviousWeek,
} from './activities/weekly-analytics/buildEmailFromPostgreSQL'

import {
  getTotalActivitiesThisWeek,
  getTotalActivitiesPreviousWeek,
  getNewActivitiesThisWeek,
  getNewActivitiesPreviousWeek,
  getMostActiveMembersThisWeek,
  getMostActiveOrganizationsThisWeek,
  getTopActivityTypes,
  getConversations,
  getActiveMembersThisWeek,
  getActiveMembersPreviousWeek,
  getActiveOrganizationsThisWeek,
  getActiveOrganizationsPreviousWeek,
} from './activities/weekly-analytics/buildEmailFromQuestDB'

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
