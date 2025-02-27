import { singleOrDefault } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { loadJobs } from './loader'

if (process.argv.length !== 3) {
  throw new Error(`Needs job name as argument!`)
}

const jobName = process.argv[2]

const log = getServiceChildLogger(`worker/job/${jobName}`)

setImmediate(async () => {
  try {
    // find the job to execute
    const jobs = await loadJobs()

    const job = singleOrDefault(jobs, (j) => j.name === jobName)

    if (job) {
      log.info('Starting a new job...')
      await job.process({
        log,
      })
      process.exit(0)
    } else {
      log.error('Job not found!')
      process.exit(1)
    }
  } catch (err) {
    log.error(err, 'Failed to execute the job.')
    process.exit(1)
  }
})
