import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import memberScoreCoordinator from './memberScoreCoordinator'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshMaterializedViewsForCube from './refreshMaterializedViewsForCube'
import downgradeExpiredPlans from './downgradeExpiredPlans'
import integrationDataChecker from './integrationDataChecker'
import refreshSampleData from './refreshSampleData'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import enrichOrganizations from './organizationEnricher'
import refreshGroupsioToken from './refreshGroupsioToken'
import refreshGitlabToken from './refreshGitlabToken'
import refreshGithubRepoSettings from './refreshGithubRepoSettings'

const jobs: CrowdJob[] = [
  integrationTicks,
  memberScoreCoordinator,
  refreshMaterializedViews,
  refreshMaterializedViewsForCube,
  downgradeExpiredPlans,
  integrationDataChecker,
  refreshSampleData,
  cleanUp,
  checkStuckIntegrationRuns,
  enrichOrganizations,
  refreshGroupsioToken,
  refreshGitlabToken,
  refreshGithubRepoSettings,
]

export default jobs
