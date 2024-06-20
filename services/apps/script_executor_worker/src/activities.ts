import {
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
} from './activities/merge-members-with-similar-identities'

import {
  findMemberMergeActions,
  findMemberIdentitiesGroupedByPlatform,
  findMemberById,
} from './activities/dissect-member'

import {
  mergeMembers,
  unmergeMembers,
  unmergeMembersPreview,
  waitForTemporalWorkflowExecutionFinish,
} from './activities/common'

export {
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
  mergeMembers,
  findMemberMergeActions,
  unmergeMembers,
  unmergeMembersPreview,
  waitForTemporalWorkflowExecutionFinish,
  findMemberIdentitiesGroupedByPlatform,
  findMemberById,
}
