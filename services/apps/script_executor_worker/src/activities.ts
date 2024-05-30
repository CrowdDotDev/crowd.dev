import {
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
} from './activities/merge-members-with-similar-identities'

import {
  mergeMembers,
  unmergeMembers,
  syncMember,
  syncActivities,
  recalculateActivityAffiliationsOfMemberAsync,
  waitForTemporalWorkflowExecutionFinish,
} from './activities/common'

import {
  findActivitiesWithWrongMemberId,
  updateActivityMember,
} from './activities/fix-activities-with-wrong-members'
import { findMemberMergeActions } from './activities/dissect-member'

export {
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
  mergeMembers,
  findActivitiesWithWrongMemberId,
  syncMember,
  updateActivityMember,
  recalculateActivityAffiliationsOfMemberAsync,
  syncActivities,
  findMemberMergeActions,
  unmergeMembers,
  waitForTemporalWorkflowExecutionFinish,
}
