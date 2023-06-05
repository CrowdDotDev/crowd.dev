import MemberService from '../../services/memberService'
import Operations from './operations'
import ActivityService from '../../services/activityService'
import IntegrationService from '../../services/integrationService'
import MicroserviceService from '../../services/microserviceService'
import { IServiceOptions } from '../../services/IServiceOptions'

/**
 * Update a bulk of members
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function updateMembers(records: Array<any>, options: IServiceOptions): Promise<any> {
  const memberService = new MemberService(options)

  while (records.length > 0) {
    const record = records.shift()
    await memberService.update(record.id, record.update)
  }
}

/**
 * Upsert a bulk of members
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function upsertMembers(records: Array<any>, options: IServiceOptions): Promise<any> {
  const memberService = new MemberService(options)

  while (records.length > 0) {
    const record = records.shift()
    await memberService.upsert(record)
  }
}

/**
 * Upsert a bulk of activities with members
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function upsertActivityWithMembers(
  records: Array<any>,
  options: IServiceOptions,
  fireCrowdWebhooks: boolean = true,
): Promise<any> {
  const activityService = new ActivityService(options)

  while (records.length > 0) {
    const record = records.shift()
    await activityService.createWithMember(record, fireCrowdWebhooks)
  }
}

/**
 * Update a bulk of integrations
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function updateIntegrations(records: Array<any>, options: IServiceOptions): Promise<any> {
  const integrationService = new IntegrationService(options)

  while (records.length > 0) {
    const record = records.shift()
    await integrationService.update(record.id, record.update)
  }
}

/**
 * Update a bulk of microservices
 * @param records The records to perform the operation to
 */
async function updateMicroservice(records: Array<any>, options: IServiceOptions): Promise<any> {
  const microserviceService = new MicroserviceService(options)

  while (records.length > 0) {
    const record = records.shift()
    await microserviceService.update(record.id, record.update)
  }
}

/**
 * Worker function to choose an operation to perform
 * @param operation Operation to perform, one in the list of Operations
 * @param records Records to perform the operation to
 * @returns
 */
async function bulkOperations(
  operation: string,
  records: Array<any>,
  options: IServiceOptions,
  fireCrowdWebhooks: boolean = true,
): Promise<any> {
  switch (operation) {
    case Operations.UPDATE_MEMBERS:
      return updateMembers(records, options)

    case Operations.UPSERT_MEMBERS:
      return upsertMembers(records, options)

    case Operations.UPSERT_ACTIVITIES_WITH_MEMBERS:
      return upsertActivityWithMembers(records, options, fireCrowdWebhooks)

    case Operations.UPDATE_INTEGRATIONS:
      return updateIntegrations(records, options)

    case Operations.UPDATE_MICROSERVICE:
      return updateMicroservice(records, options)

    default:
      throw new Error(`Operation ${operation} not found`)
  }
}

export default bulkOperations
