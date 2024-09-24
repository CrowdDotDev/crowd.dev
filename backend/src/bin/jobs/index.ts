import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshMaterializedViewsForCube from './refreshMaterializedViewsForCube'
import downgradeExpiredPlans from './downgradeExpiredPlans'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import refreshGroupsioToken from './refreshGroupsioToken'
import refreshGitlabToken from './refreshGitlabToken'
import refreshGithubRepoSettings from './refreshGithubRepoSettings'

const jobs: CrowdJob[] = [
  integrationTicks,
  refreshMaterializedViews,
  refreshMaterializedViewsForCube,
  downgradeExpiredPlans,
  cleanUp,
  checkStuckIntegrationRuns,
  refreshGroupsioToken,
  refreshGitlabToken,
  refreshGithubRepoSettings,
]

export default jobs
