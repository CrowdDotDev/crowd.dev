import { updateEmailHistory } from './activities/updateEmailHistory'

import { getNextEmails as eagleeyeGetNextEmails } from './activities/eagleeye-digest/getNextEmails'
import { sendEmail as eagleeyeSendEmail } from './activities/eagleeye-digest/sendEmail'
import { updateNextEmailAt as eagleeyeUpdateNextEmailAt } from './activities/eagleeye-digest/updateEmailHistory'
import {
  buildEmailContent as eagleeyeBuildEmailContent,
  fetchFromDatabase as eagleeyeFetchFromDatabase,
  fetchFromEagleEye as eagleeyeFetchFromEagleEye,
} from './activities/eagleeye-digest/buildEmail'

import { sendEmail as weeklySendEmail } from './activities/weekly-analytics/sendEmail'
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
  weeklySendEmail,
}
