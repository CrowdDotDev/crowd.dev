import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG } from '../conf'

import {
  checkIfMemberExists,
  deleteMemberSegments,
  deleteMember,
  deleteMemberActivities,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/delete-members'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: memberIds')
  process.exit(1)
}

const memberIds = processArguments[0].split(',')

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())

  log.info(`Started deleting members with ids: ${memberIds.join(', ')}`)

  const totalMemberIds = memberIds.length
  let processedMembers = 0

  for (const memberId of memberIds) {
    const memberExists = await checkIfMemberExists(dbClient, memberId)

    if (!memberExists) {
      log.info(`Member not found: ${memberId}`)
      continue
    }

    await deleteMemberActivities(dbClient, memberId)
    await deleteMemberSegments(dbClient, memberId)
    await deleteMember(dbClient, memberId)

    processedMembers += 1

    log.info(`deleted ${processedMembers}/${totalMemberIds} members!`)
  }

  log.info('Finished deleting members!')

  process.exit(0)
})
