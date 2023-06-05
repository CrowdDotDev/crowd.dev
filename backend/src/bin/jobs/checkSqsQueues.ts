import cronGenerator from 'cron-time-generator'
import { sendSlackAlert } from '../../utils/slack'
import { SQS_CONFIG } from '../../conf'
import { sqs } from '../../services/aws'
import { CrowdJob } from '../../types/jobTypes'

interface IQueueCount {
  lastCount: number
  increaseCount: number
}

const queues = [SQS_CONFIG.nodejsWorkerQueue, SQS_CONFIG.pythonWorkerQueue]

const messageCounts: Map<string, IQueueCount> = new Map<string, IQueueCount>()

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
          const previousValue = messageCounts.get(queue)
          if (previousValue.lastCount < value) {
            if (previousValue.increaseCount > 2) {
              await sendSlackAlert(
                `*Warning*: Queue ${queue} messages have *increasted #${previousValue.increaseCount} times*  - last increase was *from ${previousValue.lastCount} to ${value}*!`,
              )
            }

            messageCounts.set(queue, {
              lastCount: value,
              increaseCount: previousValue.increaseCount + 1,
            })
          } else {
            messageCounts.set(queue, {
              lastCount: value,
              increaseCount: 0,
            })
          }
        } else {
          messageCounts.set(queue, {
            lastCount: value,
            increaseCount: value > 0 ? 1 : 0,
          })
        }
      }
    }
  },
}

export default job
