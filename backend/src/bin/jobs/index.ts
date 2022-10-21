import { CrowdJob } from '../../utils/jobTypes'
import devtoCoordinator from './devtoCoordinator'
import twitterCoordinator from './twitterCoordinator'
import twitterReachCoordinator from './twitterReachCoordinator'
import discordCoordinator from './discordCoordinator'
import slackCoordinator from './slackCoordinator'
import weeklyAnalyticsEmailsCoordinator from './weeklyAnalyticsEmailsCoordinator'
import memberScoreCoordinator from './memberScoreCoordinator'

const jobs: CrowdJob[] = [
  devtoCoordinator,
  twitterCoordinator,
  twitterReachCoordinator,
  discordCoordinator,
  slackCoordinator,
  weeklyAnalyticsEmailsCoordinator,
  memberScoreCoordinator,
]

export default jobs
