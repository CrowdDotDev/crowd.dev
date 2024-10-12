import { QueueFactory, QueueReceiver } from '@crowd/queue'
import { getServiceChildLogger } from '@crowd/logging'
import { IQueueMessage } from '@crowd/types'
import { QUEUE_CONFIG } from '@/conf'
import { IKafkaChannelConfig } from '@crowd/queue/src/vendors/kafka/types'
import { timeout } from '@crowd/common'

const logger = getServiceChildLogger('kafka-publish')

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG)
  const queueConf: IKafkaChannelConfig = {
    name: 'qdb-activities',
    partitions: {
      default: 1,
    },
    replicationFactor: 1,
  }

  const receiver = new (class extends QueueReceiver {
    protected async processMessage(data: IQueueMessage): Promise<void> {
      console.log('msg', data)
      await timeout(1000)
    }
  })(queueClient, queueConf, 1, logger)

  await receiver.start(queueConf)

  // process.exit(0)
})
