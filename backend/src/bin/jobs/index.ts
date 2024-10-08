import { CrowdJob } from '../../types/jobTypes'
import integrationTicks from './integrationTicks'
import refreshMaterializedViews from './refreshMaterializedViews'
import cleanUp from './cleanUp'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import refreshGroupsioToken from './refreshGroupsioToken'
import refreshGitlabToken from './refreshGitlabToken'
import refreshGithubRepoSettings from './refreshGithubRepoSettings'
import autoImportGroups from './autoImportGroupsioGroups'

const jobs: CrowdJob[] = [
  integrationTicks,
  refreshMaterializedViews,
  cleanUp,
  checkStuckIntegrationRuns,
  refreshGroupsioToken,
  refreshGitlabToken,
  refreshGithubRepoSettings,
  autoImportGroups,
]

export default jobs
