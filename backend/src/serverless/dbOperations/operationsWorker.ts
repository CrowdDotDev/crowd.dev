import MemberService from '../../services/memberService'
import getUserContext from '../../database/utils/getUserContext'
import Operations from './operations'
import ActivityService from '../../services/activityService'
import IntegrationService from '../../services/integrationService'
import MicroserviceService from '../../services/microserviceService'

/**
 * Update a bulk of members
 * @param tenantId Tenant ID
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function updateMembers(tenantId: string, records: Array<any>): Promise<any> {
  const userContext = await getUserContext(tenantId)
  const memberService = new MemberService(userContext)
  for (const record of records) {
    await memberService.update(record.id, record.update)
  }
}

/**
 * Upsert a bulk of members
 * @param tenantId Tenant ID
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function upsertMembers(tenantId: string, records: Array<any>): Promise<any> {
  const userContext = await getUserContext(tenantId)
  const memberService = new MemberService(userContext)
  for (const record of records) {
    await memberService.upsert(record)
  }
}

/**
 * Update members to merge for a set of members
 * @param tenantId Tenant ID
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function updateMembersToMerge(tenantId: string, records: Array<any>): Promise<any> {
  const userContext = await getUserContext(tenantId)
  const memberService = new MemberService(userContext)
  for (const record of records) {
    await memberService.addToMerge(record[0], record[1])
  }
}

/**
 * Upsert a bulk of activities with members
 * @param tenantId Tenant ID
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function upsertActivityWithMembers(tenantId: string, records: Array<any>): Promise<any> {
  const userContext = await getUserContext(tenantId)
  const activityService = new ActivityService(userContext)
  for (const record of records) {
    await activityService.createWithMember(record)
  }
}

/**
 * Update a bulk of integrations
 * @param tenantId Tenant ID
 * @param records The records to perform the operation to
 * @returns Success/error message
 */
async function updateIntegrations(tenantId: string, records: Array<any>): Promise<any> {
  const userContext = await getUserContext(tenantId)
  const integrationService = new IntegrationService(userContext)
  for (const record of records) {
    await integrationService.update(record.id, record.update)
  }
}

/**
 * Update a bulk of microservices
 * @param tenantId Tenant ID
 * @param records The records to perform the operation to
 */
async function updateMicroservice(tenantId: string, records: Array<any>): Promise<any> {
  const userContext = await getUserContext(tenantId)
  const microserviceService = new MicroserviceService(userContext)
  for (const record of records) {
    await microserviceService.update(record.id, record.update)
  }
}

/**
 * Worker function to choose an operation to perform
 * @param tenantId Tenant ID
 * @param operation Operation to perform, one in the list of Operations
 * @param records Records to perform the operation to
 * @returns
 */
async function bulkOperations(
  tenantId: string,
  operation: string,
  records: Array<any>,
): Promise<any> {
  switch (operation) {
    case Operations.UPDATE_MEMBERS:
      return updateMembers(tenantId, records)

    case Operations.UPSERT_MEMBERS:
      return upsertMembers(tenantId, records)

    case Operations.UPDATE_MEMBERS_TO_MERGE:
      return updateMembersToMerge(tenantId, records)

    case Operations.UPSERT_ACTIVITIES_WITH_MEMBERS:
      return upsertActivityWithMembers(tenantId, records)

    case Operations.UPDATE_INTEGRATIONS:
      return updateIntegrations(tenantId, records)

    case Operations.UPDATE_MICROSERVICE:
      return updateMicroservice(tenantId, records)

    default:
      throw new Error(`Operation ${operation} not found`)
  }
}

export default bulkOperations
