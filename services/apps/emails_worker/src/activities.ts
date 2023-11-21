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
} from './activities/weekly-analytics/buildEmailFromCube'

import {
  getTenantUsers,
  getSegments,
  getMostActiveMembers,
  getMostActiveOrganizations,
  getTopActivityTypes,
  getConversations,
  getActiveTenantIntegrations,
} from './activities/weekly-analytics/buildEmailFromDatabase'

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
  getMostActiveMembers,
  getMostActiveOrganizations,
  getTopActivityTypes,
  getConversations,
  getActiveTenantIntegrations,
  weeklyGetNextEmails,
  calculateTimes,
  weeklySendEmail,
}
