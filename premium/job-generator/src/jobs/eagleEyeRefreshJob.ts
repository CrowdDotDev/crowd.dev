import cronGenerator from 'cron-time-generator'
import { sendPremiumPythonWorkerMessage } from '../premiumPythonWorkerSQS'
import { CrowdJob } from '../types'

const job: CrowdJob = {
  name: 'Eagle-eye Refresh Job',
  cronTime: cronGenerator.every(2).hours(),
  onTrigger: async () => {
    try {
      await sendPremiumPythonWorkerMessage({
        platform: 'devto',
      })
    } catch (err) {
      console.log('Error while emitting DEV Eagle-eye refresh message!', err)
    }

    try {
      await sendPremiumPythonWorkerMessage({
        platform: 'hacker_news',
      })
    } catch (err) {
      console.log('Error while emitting Hacker News Eagle-eye refresh message!', err)
    }
  },
}

export default job
