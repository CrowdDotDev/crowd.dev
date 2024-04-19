import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import memberScoreCoordinator from './memberScoreCoordinator'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshMaterializedViewsForCube from './refreshMaterializedViewsForCube'
import downgradeExpiredPlans from './downgradeExpiredPlans'
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
  refreshSampleData,
  cleanUp,
  checkStuckIntegrationRuns,
  enrichOrganizations,
  refreshGroupsioToken,
]

export default jobs
