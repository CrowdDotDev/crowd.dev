import { CrowdJob } from '../../types/jobTypes'
import checkMemberScoresCoordinator from './checkMemberScoresCoordinator'
import checkMembersToMergeCoordinator from './checkMembersToMergeCoordinator'
import integrationTicks from './integrationTicks'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'
import checkSqsQueues from './checkSqsQueues'

const jobs: CrowdJob[] = [
  weeklyAnalyticsEmailsCoordinator,
  checkMemberScoresCoordinator,
  checkMembersToMergeCoordinator,
  integrationTicks,
  checkSqsQueues,
]

export default jobs
