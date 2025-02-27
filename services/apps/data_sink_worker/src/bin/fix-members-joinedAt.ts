import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  getMemberRecentActivity,
  getMembersWithJoinedAtUnixEpoch,
  updateMemberJoinedAt,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-members-joinedAt'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, log)
  await searchSyncWorkerEmitter.init()

  log.info('Started fixing members with joinedAt set to unix epoch!')

  const totalMembers = (await getMembersWithJoinedAtUnixEpoch(dbClient, { countOnly: true })).count

  if (totalMembers == 0) {
    log.info('No members with incorrect joinedAt and activities found!')
    process.exit(0)
  }

  log.info(`Found ${totalMembers} members`)

  let processedMembers = 0

  while (processedMembers < totalMembers) {
    const result = await getMembersWithJoinedAtUnixEpoch(dbClient, {})

    for (const member of result.rows) {
      const memberId = member.id
      const activity = await getMemberRecentActivity(dbClient, memberId)

      if (member.joinedAt != activity.timestamp) {
        // update member joinedAt if it's different from the latest activity timestamp
        await updateMemberJoinedAt(dbClient, memberId, activity.timestamp)
        // sync member to open-search
        await searchSyncWorkerEmitter.triggerMemberSync(memberId, false)
      }

      processedMembers++
    }

    log.info(`Processed ${processedMembers}/${totalMembers}!`)
  }

  log.info('Finished fixing members with incorrect joinedAt!')

  process.exit(0)
})
