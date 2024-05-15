import {
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
} from './activities/merge-members-with-similar-identities'

import { mergeMembers, syncMember } from './activities/common'

import {
  findActivitiesWithWrongMemberId,
  updateActivityMember,
} from './activities/fix-activities-with-wrong-members'

export {
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
  mergeMembers,
  findActivitiesWithWrongMemberId,
  syncMember,
  updateActivityMember,
}
