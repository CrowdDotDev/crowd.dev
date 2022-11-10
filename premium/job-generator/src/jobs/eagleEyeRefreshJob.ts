import cronGenerator from 'cron-time-generator'
import { createServiceChildLogger } from '../logging'
import { sendPremiumPythonWorkerMessage } from '../premiumPythonWorkerSQS'
import { CrowdJob } from '../types'

const log = createServiceChildLogger('Eagle-eye Refresh Job')

const job: CrowdJob = {
  name: 'Eagle-eye Refresh Job',
  cronTime: cronGenerator.every(2).hours(),
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
