import { getSqsClient } from '@crowd/sqs'
import { SQS_CONFIG } from '@/conf'

export const SQS_CLIENT = getSqsClient({
  region: SQS_CONFIG.aws.region,
  host: SQS_CONFIG.host,
  port: SQS_CONFIG.port,
  accessKeyId: SQS_CONFIG.aws.accessKeyId,
  secretAccessKey: SQS_CONFIG.aws.secretAccessKey,
})
