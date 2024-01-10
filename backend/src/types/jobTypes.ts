import { Logger } from '@crowd/logging'

export interface CrowdJob {
  name: string
  cronTime: string
  onTrigger: (log: Logger) => Promise<void>
}
