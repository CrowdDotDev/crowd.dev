import { CrowdJob } from '../../types/jobTypes'

import autoImportGroups from './autoImportGroupsioGroups'
import checkStuckIntegrationRuns from './checkStuckIntegrationRuns'
import cleanUp from './cleanUp'
import integrationTicks from './integrationTicks'
// import refreshGithubRepoSettingsJob from './refreshGithubRepoSettings'
import refreshGitlabToken from './refreshGitlabToken'
import refreshGroupsioToken from './refreshGroupsioToken'
import refreshMaterializedViews from './refreshMaterializedViews'
import syncActivitiesJob from './syncActivities'

const jobs: CrowdJob[] = [
  integrationTicks,
  refreshMaterializedViews,
  cleanUp,
  checkStuckIntegrationRuns,
  refreshGroupsioToken,
  refreshGitlabToken,
  // refreshGithubRepoSettingsJob,
  autoImportGroups,
  syncActivitiesJob,
]

export default jobs
