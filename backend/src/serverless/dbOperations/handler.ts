import { getServiceChildLogger } from '@crowd/logging'
import { KUBE_MODE } from '../../conf/index'
import bulkOperations from './operationsWorker'
import getUserContext from '../../database/utils/getUserContext'
import SegmentRepository from '../../database/repositories/segmentRepository'

const log = getServiceChildLogger('dbOperations.handler')

export async function consumer(event) {
  if (!KUBE_MODE) {
    event = JSON.parse(event.Records[0].body)
  }

  log.debug({ event }, `DbOperations event!`)
  const tenantId = event.tenantId || event.tenant_id

  if (!tenantId) {
    throw new Error('Tenant ID is required')
  } else if (!event.operation) {
    throw new Error('Operation is required')
  } else if (!event.records) {
    throw new Error('Records is required')
  }

  const context = await getUserContext(tenantId)
  const segmentRepository = new SegmentRepository(context)
  context.currentSegments = [await segmentRepository.findById(event.segments[0])]
  console.log('EVENT_SEGMENTS', event.segments)
  console.log('CONTEXT_SEGMENTS', context.currentSegments)

  const result = await bulkOperations(event.operation, event.records, context)

  return result
}
