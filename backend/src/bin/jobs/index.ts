import { CrowdJob } from '../../utils/jobTypes'
import checkMemberScoresCoordinator from './checkMemberScoresCoordinator'
import checkMembersToMergeCoordinator from './checkMembersToMergeCoordinator'
import discordCoordinator from './discordCoordinator'
import integrationTicks from './integrationTicks'
import slackCoordinator from './slackCoordinator'
import twitterCoordinator from './twitterCoordinator'
import twitterReachCoordinator from './twitterReachCoordinator'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'

const jobs: CrowdJob[] = [
  twitterCoordinator,
  twitterReachCoordinator,
  discordCoordinator,
  slackCoordinator,
  weeklyAnalyticsEmailsCoordinator,
  checkMemberScoresCoordinator,
  checkMembersToMergeCoordinator,
  integrationTicks,
]

export default jobs
