import { NANGO_CONFIG } from '../conf'
import { Entity, HubspotSettings, IOrganization, IOrganizationSyncRemoteData } from '@crowd/types'
import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { IntegrationRepository } from '@crowd/data-access-layer/src/old/apps/integration_sync_worker/integration.repo'
import {
  IBatchCreateOrganizationsResult,
  IBatchUpdateOrganizationsResult,
  IIntegrationProcessRemoteSyncContext,
  INTEGRATION_SERVICES,
} from '@crowd/integrations'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/integration_sync_worker/organization.repo'
import { IDbIntegration } from '@crowd/data-access-layer/src/old/apps/integration_sync_worker/integration.data'
import { AutomationRepository } from '@crowd/data-access-layer/src/old/apps/integration_sync_worker/automation.repo'
import { AutomationExecutionRepository } from '@crowd/data-access-layer/src/old/apps/integration_sync_worker/automationExecution.repo'

export class OrganizationSyncService extends LoggerBase {
  private readonly organizationRepo: OrganizationRepository
  private readonly integrationRepo: IntegrationRepository
  private readonly automationRepo: AutomationRepository
  private readonly automationExecutionRepo: AutomationExecutionRepository

  constructor(store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.integrationRepo = new IntegrationRepository(store, this.log)
    this.organizationRepo = new OrganizationRepository(store, this.log)
    this.automationRepo = new AutomationRepository(store, this.log)
    this.automationExecutionRepo = new AutomationExecutionRepository(store, this.log)
  }

  public async syncOrganization(
    tenantId: string,
    integrationId: string,
    organizationId: string,
    syncRemoteId: string,
  ): Promise<void> {
    const integration = await this.integrationRepo.findById(integrationId)

    const organization = await this.organizationRepo.findOrganization(
      organizationId,
      tenantId,
      integration.segmentId,
    )

    const syncRemote = await this.organizationRepo.findSyncRemoteById(syncRemoteId)

    const oranizationsToCreate = []
    const organizationsToUpdate = []

    if (syncRemote.sourceId) {
      // organization.attributes = {
      //   ...organization.attributes,
      //   sourceId: {
      //     ...(organization.attributes.sourceId || {}),
      //     [integration.platform]: syncRemote.sourceId,
      //   },
      // }
      organizationsToUpdate.push(organization)
    } else {
      oranizationsToCreate.push(organization)
    }

    const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

    this.log.info(`Syncing organization ${organizationId} to ${integration.platform} remote!`)

    if (service.processSyncRemote) {
      const context: IIntegrationProcessRemoteSyncContext = {
        integration,
        log: this.log,
        serviceSettings: {
          nangoId: `${tenantId}-${integration.platform}`,
          nangoUrl: NANGO_CONFIG().url,
          nangoSecretKey: NANGO_CONFIG().secretKey,
        },
        tenantId,
      }

      const { created, updated } = await service.processSyncRemote<IOrganization>(
        oranizationsToCreate,
        organizationsToUpdate,
        Entity.ORGANIZATIONS,
        context,
      )

      if (created.length > 0) {
        const orgCreated = created[0] as IBatchCreateOrganizationsResult
        await this.organizationRepo.setSyncRemoteSourceId(syncRemoteId, orgCreated.sourceId)
        await this.organizationRepo.setLastSyncedAtBySyncRemoteId(
          syncRemoteId,
          orgCreated.lastSyncedPayload,
        )
      }

      if (updated.length > 0) {
        const orgUpdated = updated[0] as IBatchUpdateOrganizationsResult
        await this.organizationRepo.setLastSyncedAtBySyncRemoteId(
          syncRemoteId,
          orgUpdated.lastSyncedPayload,
        )
      }
    } else {
      this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
    }
  }

  public async syncAllMarkedOrganizations(
    tenantId: string,
    integrationId: string,
    batchSize = 100,
  ): Promise<void> {
    const integration: IDbIntegration = await this.integrationRepo.findById(integrationId)

    let markedOrganizations: IOrganizationSyncRemoteData[]
    let offset

    do {
      const organizationsToCreate: IOrganization[] = []
      const organizationsToUpdate: IOrganization[] = []

      offset = markedOrganizations ? offset + batchSize : 0

      markedOrganizations = await this.organizationRepo.findMarkedOrganizations(
        integration.id,
        batchSize,
        offset,
      )

      for (const organizationToSync of markedOrganizations) {
        this.log.info(
          `Syncing organization ${organizationToSync.organizationId} to ${integration.platform} remote!`,
        )

        const organization = await this.organizationRepo.findOrganization(
          organizationToSync.organizationId,
          tenantId,
          integration.segmentId,
        )

        if (organizationToSync.sourceId) {
          // append sourceId to object - it'll be used for updating the remote counterpart
          // organization.attributes = organization.attributes || {}

          // organization.attributes = {
          //   ...organization.attributes,
          //   sourceId: {
          //     ...(organization.attributes.sourceId || {}),
          //     [integration.platform]: organizationToSync.sourceId,
          //   },
          // }
          organizationsToUpdate.push(organization)
        } else {
          organizationsToCreate.push(organization)
        }
      }

      const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

      if (service.processSyncRemote) {
        const context: IIntegrationProcessRemoteSyncContext = {
          integration,
          log: this.log,
          serviceSettings: {
            nangoId: `${tenantId}-${integration.platform}`,
            nangoUrl: NANGO_CONFIG().url,
            nangoSecretKey: NANGO_CONFIG().secretKey,
          },
          tenantId,
        }

        const { created, updated } = await service.processSyncRemote<IOrganization>(
          organizationsToCreate,
          organizationsToUpdate,
          Entity.ORGANIZATIONS,
          context,
        )

        for (const newOrganization of created as IBatchCreateOrganizationsResult[]) {
          await this.organizationRepo.setIntegrationSourceId(
            newOrganization.organizationId,
            integration.id,
            newOrganization.sourceId,
          )

          await this.organizationRepo.setLastSyncedAt(
            newOrganization.organizationId,
            integration.id,
            newOrganization.lastSyncedPayload,
          )
        }

        for (const updatedOrganization of updated as IBatchUpdateOrganizationsResult[]) {
          await this.organizationRepo.setLastSyncedAt(
            updatedOrganization.organizationId,
            integration.id,
            updatedOrganization.lastSyncedPayload,
          )
        }
      } else {
        this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
      }
    } while (markedOrganizations.length > 0)
  }

  public async syncAllFilteredOrganizations(
    tenantId: string,
    integrationId: string,
    automationId: string,
    batchSize = 50,
  ) {
    const integration: IDbIntegration = await this.integrationRepo.findById(integrationId)
    const automation = await this.automationRepo.findById(automationId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const syncOrganizationMembers = (automation.settings as any)?.syncCompanyContacts === true

    const organizationsIdsSyncedToReturn = []

    let filteredOrganizations: { id: string }[]
    let offset

    try {
      do {
        const organizationsToCreate: IOrganization[] = []
        const organizationsToUpdate: IOrganization[] = []

        offset = filteredOrganizations ? offset + batchSize : 0

        filteredOrganizations = await this.organizationRepo.findFilteredOrganizations(
          tenantId,
          [integration.segmentId],
          integration.platform,
          (automation.settings as HubspotSettings).filter,
          batchSize,
          offset,
        )

        for (const organizationToSync of filteredOrganizations) {
          this.log.info(
            `Syncing organization ${organizationToSync.id} to ${integration.platform} remote!`,
          )

          let syncRemote = await this.organizationRepo.findSyncRemote(
            organizationToSync.id,
            integration.id,
            automation.id,
          )

          // member isn't marked yet, mark it
          if (!syncRemote) {
            syncRemote = await this.organizationRepo.markOrganizationForSyncing({
              integrationId: integration.id,
              organizationId: organizationToSync.id,
              metaData: null,
              syncFrom: automation.id,
            })
          }

          const organization = await this.organizationRepo.findOrganization(
            organizationToSync.id,
            tenantId,
            integration.segmentId,
          )

          if (syncRemote.sourceId) {
            // organization.attributes = {
            //   ...organization.attributes,
            //   sourceId: {
            //     ...(organization.attributes.sourceId || {}),
            //     [integration.platform]: syncRemote.sourceId,
            //   },
            // }
            organizationsToUpdate.push(organization)
          } else {
            organizationsToCreate.push(organization)
          }
        }

        const service = singleOrDefault(
          INTEGRATION_SERVICES,
          (s) => s.type === integration.platform,
        )

        if (service.processSyncRemote) {
          const context: IIntegrationProcessRemoteSyncContext = {
            integration,
            log: this.log,
            serviceSettings: {
              nangoId: `${tenantId}-${integration.platform}`,
              nangoUrl: NANGO_CONFIG().url,
              nangoSecretKey: NANGO_CONFIG().secretKey,
            },
            tenantId,
          }

          const { created, updated } = await service.processSyncRemote<IOrganization>(
            organizationsToCreate,
            organizationsToUpdate,
            Entity.ORGANIZATIONS,
            context,
          )

          for (const newOrganization of created as IBatchCreateOrganizationsResult[]) {
            await this.organizationRepo.setIntegrationSourceId(
              newOrganization.organizationId,
              integration.id,
              newOrganization.sourceId,
            )

            await this.organizationRepo.setLastSyncedAt(
              newOrganization.organizationId,
              integration.id,
              newOrganization.lastSyncedPayload,
            )
          }

          for (const updatedOrganization of updated as IBatchUpdateOrganizationsResult[]) {
            await this.organizationRepo.setLastSyncedAt(
              updatedOrganization.organizationId,
              integration.id,
              updatedOrganization.lastSyncedPayload,
            )
          }

          if (syncOrganizationMembers) {
            organizationsIdsSyncedToReturn.push(...organizationsToCreate.map((o) => o.id))
            organizationsIdsSyncedToReturn.push(...organizationsToUpdate.map((o) => o.id))
          }
        } else {
          this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
        }
      } while (filteredOrganizations.length > 0)

      await this.automationExecutionRepo.addExecution({
        automationId: automation.id,
        type: automation.type,
        trigger: automation.trigger,
        tenantId: automation.tenantId,
        state: 'success',
        payload: {
          type: automation.type,
          trigger: automation.trigger,
        },
        error: null,
      })
    } catch (e) {
      await this.automationExecutionRepo.addExecution({
        automationId: automation.id,
        type: automation.type,
        trigger: automation.trigger,
        tenantId: automation.tenantId,
        state: 'error',
        payload: {
          type: automation.type,
          trigger: automation.trigger,
        },
        error: JSON.stringify(e),
      })
      throw e
    }

    return syncOrganizationMembers ? organizationsIdsSyncedToReturn : []
  }
}
