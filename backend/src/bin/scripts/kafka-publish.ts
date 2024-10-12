import { generateUUIDv4, timeout } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { QueueEmitter, QueueFactory } from '@crowd/queue'
import { IKafkaChannelConfig } from '@crowd/queue/src/vendors/kafka/types'
import { IActivityCreateData } from '@crowd/types'

import { QUEUE_CONFIG } from '@/conf'

const logger = getServiceChildLogger('kafka-publish')

setImmediate(async () => {
  console.log('QUEUE_CONFIG', QUEUE_CONFIG)
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG)

  const queueConf: IKafkaChannelConfig = {
    name: 'activities',
    partitions: {
      default: 1,
    },
    replicationFactor: 1,
  }

  const emitters = Array.from({ length: 1 }, () => new QueueEmitter(queueClient, queueConf, logger))

  while (true) {
    const payload: IActivityCreateData = {
      id: generateUUIDv4(),
      isContribution: true,
      type: 'comment',
      timestamp: new Date('2018-04-24T08:29:53.000Z'),
      platform: 'devto',
      score: 0,
      sourceId: generateUUIDv4(),
      attributes: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      memberId: '17b029a0-b5f5-11ee-9623-67e021c3f087',
      tenantId: '1d5f3986-bed4-4ee2-8d37-82a4882e342d',
      body: '',
      url: 'https://dev.to/robdwaller/comment/349k',
      username: 'robdwaller',
      segmentId: '8d834165-99a6-4614-b9ce-4c2dd59a1bf8',
    }

    for (let i = 0; i < emitters.length; i++) {
      const emitter = emitters[i]
      const message = `Hello, world! -- ${new Date().toISOString()} -- ${i}`
      const toSend = { ...payload, body: message }

      console.log('Sending activity', toSend)

      await emitter.sendMessage(generateUUIDv4(), toSend, generateUUIDv4())
    }
    await timeout(5000)
  }

  process.exit(0)
})
