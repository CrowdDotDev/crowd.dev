import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'
import memberScoreCoordinator from './memberScoreCoordinator'
import checkSqsQueues from './checkSqsQueues'
import refreshMaterializedViews from './refreshMaterializedViews'
import downgradeExpiredPlans from './downgradeExpiredPlans'
import eagleEyeEmailDigestTicks from './eagleEyeEmailDigestTicks'
import integrationDataChecker from './integrationDataChecker'
import mergeSuggestions from './mergeSuggestions'
import refreshSampleData from './refreshSampleData'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'

const jobs: CrowdJob[] = [
  weeklyAnalyticsEmailsCoordinator,
  integrationTicks,
  memberScoreCoordinator,
  checkSqsQueues,
  refreshMaterializedViews,
  downgradeExpiredPlans,
  eagleEyeEmailDigestTicks,
  integrationDataChecker,
  mergeSuggestions,
  refreshSampleData,
  cleanUp,
  checkStuckIntegrationRuns,
]

export default jobs
