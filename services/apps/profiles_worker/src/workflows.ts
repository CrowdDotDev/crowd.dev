import { calculateProjectGroupMemberAggregates } from './workflows/member/calculateProjectGroupMemberAggregates'
import { calculateProjectMemberAggregates } from './workflows/member/calculateProjectMemberAggregates'
import { memberUpdate } from './workflows/member/memberUpdate'
import { processMemberBotAnalysisWithLLM } from './workflows/member/processMemberBotAnalysisWithLLM'
import { recalculateAffiliationsForNewRoles } from './workflows/member/recalculateAffiliationsForNewRoles'
import { refreshMemberDisplayAggregates } from './workflows/member/refreshMemberDisplayAggregates'
import { triggerRecalculateAffiliations } from './workflows/member/triggerRecalculateAffiliations'
import { calculateProjectGroupOrganizationAggregates } from './workflows/organization/calculateProjectGroupOrganizationAggregates'
import { calculateProjectOrganizationAggregates } from './workflows/organization/calculateProjectOrganizationAggregates'
import { organizationUpdate } from './workflows/organization/organizationUpdate'
import { refreshOrganizationDisplayAggregates } from './workflows/organization/refreshOrganizationDisplayAggregates'
// TEST ONLY - for local testing when Tinybird data is not available
import { calculateLeafSegmentAggregates } from './workflows/testing/calculateLeafSegmentAggregates'

export {
  memberUpdate,
  organizationUpdate,
  recalculateAffiliationsForNewRoles,
  triggerRecalculateAffiliations,
  refreshMemberDisplayAggregates,
  refreshOrganizationDisplayAggregates,
  processMemberBotAnalysisWithLLM,
  // Child workflows for member aggregates
  calculateProjectMemberAggregates,
  calculateProjectGroupMemberAggregates,
  // Child workflows for organization aggregates
  calculateProjectOrganizationAggregates,
  calculateProjectGroupOrganizationAggregates,
  // TEST ONLY - for local testing when Tinybird data is not available
  calculateLeafSegmentAggregates,
}
