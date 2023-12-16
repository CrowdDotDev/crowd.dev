import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import memberScoreCoordinator from './memberScoreCoordinator'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshMaterializedViewsForCube from './refreshMaterializedViewsForCube'
import downgradeExpiredPlans from './downgradeExpiredPlans'
import integrationDataChecker from './integrationDataChecker'
import mergeSuggestions from './mergeSuggestions'
import refreshSampleData from './refreshSampleData'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import enrichOrganizations from './organizationEnricher'
import refreshGroupsioToken from './refreshGroupsioToken'

const jobs: CrowdJob[] = [
  integrationTicks,
  memberScoreCoordinator,
  refreshMaterializedViews,
  refreshMaterializedViewsForCube,
  downgradeExpiredPlans,
  integrationDataChecker,
  mergeSuggestions,
  refreshSampleData,
  cleanUp,
  checkStuckIntegrationRuns,
  enrichOrganizations,
  refreshGroupsioToken,
]

export default jobs
