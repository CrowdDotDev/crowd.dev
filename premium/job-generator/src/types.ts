export interface CrowdJob {
  name: string
  cronTime: string
  onTrigger: () => Promise<void>
}

export interface AwsCredentials {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface SQSConfiguration {
  host?: string
  port?: number
  nodejsWorkerQueue: string
  pythonWorkerQueue: string
  premiumPythonWorkerQueue: string
  aws: AwsCredentials
}

export enum TenantMode {
  SINGLE = 'single',
  MULTI = 'multi',
  MULTI_WITH_SUBDOMAIN = 'multi-with-subdomain',
}
