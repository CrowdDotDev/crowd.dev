// import express from 'express'

// import { getServiceLogger } from '@crowd/logging'
// import { QUEUE_CONFIG, QueueFactory } from '@crowd/queue'
// import { REDIS_CONFIG, getRedisClient } from '@crowd/redis'
// import { getDbConnection, WRITE_DB_CONFIG } from '@crowd/data-access-layer/src/database'

// const log = getServiceLogger()

// setImmediate(async () => {
//   const redis = getRedisClient(REDIS_CONFIG())
//   const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
//   const dbConnection = await getDbConnection(WRITE_DB_CONFIG(), 3, 0)

//   const app = express()
// })
