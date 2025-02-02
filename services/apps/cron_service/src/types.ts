import { Logger } from '@crowd/logging'

export interface IJobDefinition {
  // Unique identifier - only one job with the same name can run at the same time
  name: string

  // Crontab timing string
  cronTime: string

  // Seconds before the job is killed with a timeout error
  timeout: number

  // Actual job
  process: (ctx: IJobContext) => Promise<void>
}

export interface IJobContext {
  log: Logger
}
