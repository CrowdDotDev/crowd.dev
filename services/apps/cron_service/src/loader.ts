import fs from 'fs'
import path from 'path'

import { IJobDefinition } from './types'

export const loadJobs = async (): Promise<IJobDefinition[]> => {
  const jobs: IJobDefinition[] = []

  // find the job to execute
  const jobFiles = fs
    .readdirSync(path.resolve(`${__dirname}/jobs`), { withFileTypes: true })
    .filter((file) => file.isFile() && file.name.endsWith('.job.ts'))

  for (const jobFile of jobFiles) {
    const module = await import(`./jobs/${jobFile.name}`)
    if (module.default && module.default.name) {
      jobs.push(module.default as IJobDefinition)
    }
  }

  return jobs
}
