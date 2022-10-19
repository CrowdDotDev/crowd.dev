import { CrowdJob } from '../../types/jobTypes'
import checkMemberScoresCoordinator from './checkMemberScoresCoordinator'
import checkMembersToMergeCoordinator from './checkMembersToMergeCoordinator'
import integrationTicks from './integrationTicks'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'

const jobs: CrowdJob[] = [
  weeklyAnalyticsEmailsCoordinator,
  checkMemberScoresCoordinator,
  checkMembersToMergeCoordinator,
  integrationTicks,
]

export default jobs
