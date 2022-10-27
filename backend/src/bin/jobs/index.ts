import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'
import memberScoreCoordinator from './memberScoreCoordinator'
import checkSqsQueues from './checkSqsQueues'

const jobs: CrowdJob[] = [
  weeklyAnalyticsEmailsCoordinator,
  integrationTicks,
  memberScoreCoordinator,
  checkSqsQueues,
]

export default jobs
