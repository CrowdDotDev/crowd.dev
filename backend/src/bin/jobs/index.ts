import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshMaterializedViewsForCube from './refreshMaterializedViewsForCube'
import downgradeExpiredPlans from './downgradeExpiredPlans'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import refreshGroupsioToken from './refreshGroupsioToken'

const jobs: CrowdJob[] = [
  integrationTicks,
  refreshMaterializedViews,
  refreshMaterializedViewsForCube,
  downgradeExpiredPlans,
  cleanUp,
  checkStuckIntegrationRuns,
  refreshGroupsioToken,
]

export default jobs
