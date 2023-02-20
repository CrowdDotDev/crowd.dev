import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'
import memberScoreCoordinator from './memberScoreCoordinator'
import checkSqsQueues from './checkSqsQueues'
import refreshMaterializedViews from './refreshMaterializedViews'
import downgradeExpiredPlans from './downgradeExpiredPlans'
import eagleEyeEmailDigestTicks from './eagleEyeEmailDigestTicks'

const jobs: CrowdJob[] = [
  weeklyAnalyticsEmailsCoordinator,
  integrationTicks,
  memberScoreCoordinator,
  checkSqsQueues,
  refreshMaterializedViews,
  downgradeExpiredPlans,
  eagleEyeEmailDigestTicks,
]

export default jobs
