import commandLineArgs from 'command-line-args'

import { chunkArray } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/utils'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'
import { getServiceLogger } from '@crowd/logging'

import SequelizeRepository from '@/database/repositories/sequelizeRepository'

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
  const testRun = parameters.testRun ?? false

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const memberRepo = new MemberRepository(options.database, log)
  const activityRepo = new ActivityRepository(options.database, log, options.qdb)

  let results = await memberRepo.findDuplicateMembersAfterDate(cutoffDate, batchSize)

  while (results.length > 0) {
    log.info(`Processing ${results.length} duplicate member pairs...`)

    let processedCount = 0
    const startTime = Date.now()

    for (const chunk of chunkArray(results, 50)) {
      const chunkStartTime = Date.now()
      await Promise.all(
        chunk.map((result) => {
          log.info(`Moving activity relations: ${result.secondaryId} --> ${result.primaryId}`)
          return activityRepo.moveActivityRelations(
            result.primaryId,
            result.secondaryId,
            EntityType.MEMBER,
          )
        }),
      )

      processedCount += chunk.length
      const chunkTime = (Date.now() - chunkStartTime) / 1000
      const totalTime = (Date.now() - startTime) / 1000
      const itemsPerSecond = processedCount / totalTime

      log.info(`Processed chunk in ${chunkTime.toFixed(1)}s`)
      log.info(`Processing ${itemsPerSecond.toFixed(1)} items/sec`)
    }

    if (testRun) {
      log.info('Test run completed - stopping after first batch!')
      break
    }

    results = await memberRepo.findDuplicateMembersAfterDate(cutoffDate, batchSize)
  }

  log.info('No more duplicate members to cleanup! Script completed successfully.')

  // Note: Secondary members are not deleted here. The cleanupMembers workflow will automatically
  // pick them up later since they'll have no activities, identities, or memberOrganizations.

  process.exit(0)
})
