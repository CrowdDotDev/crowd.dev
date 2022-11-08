import { createServiceChildLogger } from '../../utils/logging'
import { KUBE_MODE } from '../../config/index'
import bulkOperations from './operationsWorker'

const log = createServiceChildLogger('dbOperations.handler')

export async function consumer(event) {
  if (!KUBE_MODE) {
    event = JSON.parse(event.Records[0].body)
  }

  log.info(`Event: ${event}`)
  const tenantId = event.tenantId || event.tenant_id

  if (!tenantId) {
    throw new Error('Tenant ID is required')
  } else if (!event.operation) {
    throw new Error('Operation is required')
  } else if (!event.records) {
    throw new Error('Records is required')
  }

  const result = await bulkOperations(tenantId, event.operation, event.records)

  return result
}
