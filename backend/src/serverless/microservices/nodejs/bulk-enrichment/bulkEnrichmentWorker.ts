import moment from 'moment'
import { parseAsync } from 'json2csv'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import { Hash } from '@aws-sdk/hash-node'
import { parseUrl } from '@aws-sdk/url-parser'
import { formatUrl } from '@aws-sdk/util-format-url'
import getUserContext from '../../../../database/utils/getUserContext'
import { createServiceChildLogger } from '../../../../utils/logging'
import MemberEnrichmentService from '../../../../services/premium/enrichment/memberEnrichmentService'

/**
 * Sends weekly analytics emails of a given tenant
 * to all users of the tenant.
 * Data sent is for the last week.
 * @param tenantId
 */
async function bulkEnrichmentWorker(tenantId: string, memberIds: string[]) {
  const userContext = await getUserContext(tenantId)
  const memberEnrichmentService = new MemberEnrichmentService(userContext)
  await memberEnrichmentService.bulkEnrich(memberIds)
}
export { bulkEnrichmentWorker }
