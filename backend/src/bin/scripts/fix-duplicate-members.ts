import commandLineArgs from 'command-line-args'

import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { chunkArray } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/utils'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'
import { getServiceLogger, logExecutionTimeV2 } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

import { DB_CONFIG } from '@/conf'

const log = getServiceLogger()

const options = [
  {
    name: 'cutoffDate',
    alias: 'c',
    typeLabel: '{underline cutoffDate}',
    type: String,
    description: 'The date to start looking for duplicate members from.',
  },
  {
    name: 'batchSize',
    alias: 'b',
    typeLabel: '{underline batchSize}',
    type: String,
    description: 'The maximum number of duplicate members to fix in a batch.',
  },
  {
    name: 'checkByActivityIdentity',
    alias: 'i',
    typeLabel: '{underline checkByActivityIdentity}',
    type: String,
    description: 'Whether to check for duplicate members by activity identity.',
  },
  {
    name: 'testRun',
    alias: 't',
    type: Boolean,
    description: 'Run in test mode, do not actually move activity relations.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]

const parameters = commandLineArgs(options)

setImmediate(async () => {
  const cutoffDate = parameters.cutoffDate ?? '2025-05-18'
  const batchSize = parameters.batchSize ? parseInt(parameters.batchSize, 10) : 50
  const checkByActivityIdentity = parameters.checkByActivityIdentity ?? false
  const testRun = parameters.testRun ?? false

  log.info({ cutoffDate, batchSize, testRun }, 'Running script with the following parameters!')

  const qdb = await getClientSQL()
  const db = await getDbConnection({
    host: DB_CONFIG.writeHost,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.username,
    password: DB_CONFIG.password,
  })

  let totalProcessed = 0

  const memberRepo = new MemberRepository(db, log)
  const activityRepo = new ActivityRepository(db, log, qdb)

  let results = await logExecutionTimeV2(
    () => memberRepo.findDuplicateMembersAfterDate(cutoffDate, batchSize, checkByActivityIdentity),
    log,
    'findDuplicateMembersAfterDate',
  )

  while (results.length > 0) {
    let processedCount = 0
    const startTime = performance.now()

    for (const chunk of chunkArray(results, 100)) {
      const chunkStartTime = performance.now()
      await Promise.all(
        chunk.map((result) => {
          // log the update only in test mode
          if (testRun) {
            log.info(`Updating activity relations: ${result.secondaryId} --> ${result.primaryId}`)
          }

          return activityRepo.moveActivityRelations(
            result.primaryId,
            result.secondaryId,
            EntityType.MEMBER,
          )
        }),
      )

      processedCount += chunk.length
      const chunkTime = performance.now() - chunkStartTime
      const totalTime = performance.now() - startTime
      const itemsPerSecond = processedCount / (totalTime / 1000)

      log.info(
        {
          chunkTime: Math.round(chunkTime),
          itemsPerSecond: Math.round(itemsPerSecond),
        },
        'Processed chunk!',
      )
    }

    if (testRun) {
      log.info('Test run completed - stopping after first batch!')
      break
    }

    totalProcessed += processedCount
    log.info(`Total duplicate members processed: ${totalProcessed}`)

    results = await logExecutionTimeV2(
      () =>
        memberRepo.findDuplicateMembersAfterDate(cutoffDate, batchSize, checkByActivityIdentity),
      log,
      'findDuplicateMembersAfterDate',
    )
  }

  log.info('No more duplicate members to cleanup')

  // Note: Secondary members are not deleted here. The cleanupMembers workflow will automatically
  // pick them up later since they'll have no activities, identities, or memberOrganizations.

  process.exit(0)
})
