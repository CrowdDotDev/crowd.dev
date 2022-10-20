import cronGenerator from 'cron-time-generator'
import { sendSlackAlert } from '../../utils/slack'
import { SQS_CONFIG } from '../../config'
import { sqs } from '../../services/aws'
import { CrowdJob } from '../../utils/jobTypes'

const queues = [
  SQS_CONFIG.nodejsWorkerQueue,
  SQS_CONFIG.pythonWorkerQueue,
  SQS_CONFIG.premiumPythonWorkerQueue,
]
const messageCounts: Map<string, number> = new Map<string, number>()

const job: CrowdJob = {
  name: 'Check SQS Queues',
  cronTime: cronGenerator.every(10).minutes(),
  onTrigger: async () => {
    for (const queue of queues) {
      const result = await sqs
        .getQueueAttributes({
          QueueUrl: queue,
          AttributeNames: ['ApproximateNumberOfMessages'],
        })
        .promise()

      if (result.Attributes) {
        const value = parseInt(result.Attributes.ApproximateNumberOfMessages, 10)
        if (messageCounts.has(queue)) {
          // do the actual check
          const previousValue = messageCounts.get(queue)
          if (previousValue < value) {
            // trigger warning
            await sendSlackAlert(
              `Warning: queue ${queue} has an increased amount of messages - *from ${previousValue} to ${value}*!`,
            )
          }
        }

        messageCounts.set(queue, value)
      }
    }
  },
}

export default job
