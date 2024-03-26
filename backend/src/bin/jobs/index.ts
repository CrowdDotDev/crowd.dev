import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import memberScoreCoordinator from './memberScoreCoordinator'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshMaterializedViewsForCube from './refreshMaterializedViewsForCube'
import integrationDataChecker from './integrationDataChecker'
import refreshSampleData from './refreshSampleData'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import enrichOrganizations from './organizationEnricher'

const jobs: CrowdJob[] = [
  integrationTicks,
  memberScoreCoordinator,
  refreshMaterializedViews,
  refreshMaterializedViewsForCube,
  integrationDataChecker,
  refreshSampleData,
  cleanUp,
  checkStuckIntegrationRuns,
  enrichOrganizations,
]

export default jobs
