export interface CrowdJob {
  name: string
  cronTime: string
  onTrigger: () => Promise<void>
}
