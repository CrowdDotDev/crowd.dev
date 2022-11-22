import cronGenerator from 'cron-time-generator'
import { createServiceChildLogger } from '../logging'
import { sendPremiumPythonWorkerMessage } from '../premiumPythonWorkerSQS'
import { CrowdJob } from '../types'

const log = createServiceChildLogger('Eagle-eye Refresh Job')

const job: CrowdJob = {
  name: 'Eagle-eye Refresh Job',
  // TODO: Change this to a 1 hour
  cronTime: cronGenerator.every(1).minutes(),
  onTrigger: async () => {
    try {
      await sendPremiumPythonWorkerMessage({
        platform: 'devto',
      })
    } catch (err) {
      log.error(err, 'Error while emitting DEV Eagle-eye refresh message!')
    }

    try {
      await sendPremiumPythonWorkerMessage({
        platform: 'hacker_news',
      })
    } catch (err) {
      log.error(err, 'Error while emitting Hacker News Eagle-eye refresh message!')
    }
  },
}

export default job
