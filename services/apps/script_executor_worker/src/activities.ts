import { excludeEntityFromCleanup, hasActivityRecords } from './activities/cleanup/helpers'
import { deleteMember, getMembersToCleanup } from './activities/cleanup/member'
import { deleteOrganization, getOrganizationsToCleanup } from './activities/cleanup/organization'
import {
  mergeMembers,
  mergeOrganizations,
  queueOrganizationForAggComputation,
  unmergeMembers,
  unmergeMembersPreview,
  waitForTemporalWorkflowExecutionFinish,
} from './activities/common'
import {
  getActivitiesToCopyToTinybird,
  getLatestSyncedActivityTimestampForSyncingActivitiesToTinybird,
  markActivitiesAsIndexedForSyncingActivitiesToTinybird,
  resetIndexedIdentitiesForSyncingActivitiesToTinybird,
  sendActivitiesToTinybird,
} from './activities/copy-activities-from-questdb-to-tinybird'
import {
  findMemberById,
  findMemberIdentitiesGroupedByPlatform,
  findMemberMergeActions,
} from './activities/dissect-member'
import {
  calculateMemberAffiliations,
  deleteProcessedMemberOrgAffiliations,
  getMembersWithDeletedOrgAffilations,
  getProcessedMemberOrgAffiliations,
  markMemberOrgAffiliationAsProcessed,
} from './activities/fix-deleted-member-org-affilations'
import {
  deleteOrganizationIdentity,
  findOrganizationIdentity,
  getOrgIdentitiesWithInvalidUrls,
  isLfxMember,
  updateOrganizationIdentity,
} from './activities/fix-organization-identities-with-wrong-urls'
import {
  findMembersWithSamePlatformIdentitiesDifferentCapitalization,
  findMembersWithSameVerifiedEmailsInDifferentPlatforms,
} from './activities/merge-members-with-similar-identities'
import {
  createRelations,
  getActivitiesToCopy,
  getLatestSyncedActivityTimestamp,
  markActivitiesAsIndexed,
  resetIndexedIdentities,
} from './activities/populate-activity-relations'
import { deleteIndexedEntities, markEntitiesIndexed } from './activities/sync/entity-index'
import { getMembersForSync, syncMembersBatch } from './activities/sync/member'
import { getOrganizationsForSync, syncOrganizationsBatch } from './activities/sync/organization'

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
  mergeOrganizations,
  getOrgIdentitiesWithInvalidUrls,
  findOrganizationIdentity,
  updateOrganizationIdentity,
  deleteOrganizationIdentity,
  isLfxMember,
  resetIndexedIdentitiesForSyncingActivitiesToTinybird,
  getActivitiesToCopy,
  getLatestSyncedActivityTimestampForSyncingActivitiesToTinybird,
  markActivitiesAsIndexed,
  sendActivitiesToTinybird,
  createRelations,
  resetIndexedIdentities,
  getLatestSyncedActivityTimestamp,
  deleteMember,
  getMembersToCleanup,
  deleteOrganization,
  excludeEntityFromCleanup,
  getOrganizationsToCleanup,
  hasActivityRecords,
  syncMembersBatch,
  getMembersForSync,
  getOrganizationsForSync,
  syncOrganizationsBatch,
  deleteIndexedEntities,
  markEntitiesIndexed,
  queueOrganizationForAggComputation,
  getActivitiesToCopyToTinybird,
  markActivitiesAsIndexedForSyncingActivitiesToTinybird,
  getMembersWithDeletedOrgAffilations,
  calculateMemberAffiliations,
  markMemberOrgAffiliationAsProcessed,
  getProcessedMemberOrgAffiliations,
  deleteProcessedMemberOrgAffiliations,
}
