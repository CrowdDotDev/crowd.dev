import { AutomationSyncTrigger, PlatformType } from '@crowd/types'
import {
  AutomationCriteria,
  AutomationData,
  AutomationState,
  AutomationType,
  CreateAutomationRequest,
  UpdateAutomationRequest,
} from '../types/automationTypes'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import AutomationRepository from '../database/repositories/automationRepository'
import { PageData } from '../types/common'
import { ServiceBase } from './serviceBase'
import { getIntegrationSyncWorkerEmitter } from '@/serverless/utils/serviceSQS'
import IntegrationRepository from '@/database/repositories/integrationRepository'
import Error404 from '@/errors/Error404'
import MemberSyncRemoteRepository from '@/database/repositories/memberSyncRemoteRepository'
import OrganizationSyncRemoteRepository from '@/database/repositories/organizationSyncRemoteRepository'

export default class AutomationService extends ServiceBase<
  AutomationData,
  string,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  AutomationCriteria
> {
  public constructor(options: IServiceOptions) {
    super(options)
  }

  /**
   * Creates a new active automation
   * @param req {CreateAutomationRequest} data used to create a new automation
   * @returns {AutomationData} object for frontend to use
   */
  override async create(req: CreateAutomationRequest): Promise<AutomationData> {
    const txOptions = await this.getTxRepositoryOptions()

    try {
      // create an active automation
      const result = await new AutomationRepository(txOptions).create({
        ...req,
        state: AutomationState.ACTIVE,
      })

      await SequelizeRepository.commitTransaction(txOptions.transaction)

      // check automation type, if hubspot trigger an automation onboard
      if (req.type === AutomationType.HUBSPOT) {
        let integration

        try {
          integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
            ...this.options,
          })
        } catch (err) {
          this.options.log.error(err, 'Error while fetching HubSpot integration from DB!')
          throw new Error404()
        }

        const integrationSyncWorkerEmitter = await getIntegrationSyncWorkerEmitter()
        await integrationSyncWorkerEmitter.triggerOnboardAutomation(
          this.options.currentTenant.id,
          integration.id,
          result.id,
          req.trigger as AutomationSyncTrigger,
        )
      }

      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(txOptions.transaction)
      throw error
    }
  }

  /**
   * Updates an existing automation.
   * Also used to change automation state - to enable or disable an automation.
   * It updates all the columns at once so all the properties in the request parameter
   * have to be filled.
   * @param id of the existing automation that is being updated
   * @param req {UpdateAutomationRequest} data used to update an existing automation
   * @returns {AutomationData} object for frontend to use
   */
  override async update(id: string, req: UpdateAutomationRequest): Promise<AutomationData> {
    const txOptions = await this.getTxRepositoryOptions()

    try {
      // update an existing automation including its state
      const result = await new AutomationRepository(txOptions).update(id, req)
      await SequelizeRepository.commitTransaction(txOptions.transaction)
      // check automation type, if hubspot trigger an automation onboard
      if (result.type === AutomationType.HUBSPOT) {
        let integration

        try {
          integration = await IntegrationRepository.findByPlatform(PlatformType.HUBSPOT, {
            ...this.options,
          })
        } catch (err) {
          this.options.log.error(err, 'Error while fetching HubSpot integration from DB!')
          throw new Error404()
        }

        if (
          result.trigger === AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH ||
          result.trigger === AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH
        ) {
          if (result.state === AutomationState.ACTIVE) {
            const integrationSyncWorkerEmitter = await getIntegrationSyncWorkerEmitter()
            await integrationSyncWorkerEmitter.triggerOnboardAutomation(
              this.options.currentTenant.id,
              integration.id,
              result.id,
              result.trigger as AutomationSyncTrigger,
            )
          } else if (result.trigger === AutomationSyncTrigger.MEMBER_ATTRIBUTES_MATCH) {
            // disable memberSyncRemote for given automationId
            const syncRepo = new MemberSyncRemoteRepository(this.options)
            await syncRepo.stopSyncingAutomation(result.id)
          } else if (result.trigger === AutomationSyncTrigger.ORGANIZATION_ATTRIBUTES_MATCH) {
            // disable organizationSyncRemote for given automationId
            const syncRepo = new OrganizationSyncRemoteRepository(this.options)
            await syncRepo.stopSyncingAutomation(result.id)
          }
        }
      }
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(txOptions.transaction)
      throw error
    }
  }

  /**
   * Method used to fetch all tenants automation with filters available in the criteria parameter
   * @param criteria {AutomationCriteria} filters to be used when returning automations
   * @returns {PageData<AutomationData>>}
   */
  override async findAndCountAll(criteria: AutomationCriteria): Promise<PageData<AutomationData>> {
    return new AutomationRepository(this.options).findAndCountAll(criteria)
  }

  /**
   * Method used to fetch a single automation by its id
   * @param id automation id
   * @returns {AutomationData}
   */
  override async findById(id: string): Promise<AutomationData> {
    return new AutomationRepository(this.options).findById(id)
  }

  /**
   * Deletes existing automations by id
   * @param ids automation unique IDs to be deleted
   */
  override async destroyAll(ids: string[]): Promise<void> {
    const txOptions = await this.getTxRepositoryOptions()

    try {
      const result = await new AutomationRepository(txOptions).destroyAll(ids)
      await SequelizeRepository.commitTransaction(txOptions.transaction)
      return result
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(txOptions.transaction)
      throw error
    }
  }
}
