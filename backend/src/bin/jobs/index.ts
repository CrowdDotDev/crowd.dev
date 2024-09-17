import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import memberScoreCoordinator from './memberScoreCoordinator'
import refreshMaterializedViews from './refreshMaterializedViews'
import refreshSampleData from './refreshSampleData'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import refreshGroupsioToken from './refreshGroupsioToken'
import refreshGitlabToken from './refreshGitlabToken'
import refreshGithubRepoSettings from './refreshGithubRepoSettings'

const jobs: CrowdJob[] = [
  integrationTicks,
  memberScoreCoordinator,
  refreshMaterializedViews,
  refreshSampleData,
  cleanUp,
  checkStuckIntegrationRuns,
  refreshGroupsioToken,
  refreshGitlabToken,
  refreshGithubRepoSettings,
]

export default jobs
