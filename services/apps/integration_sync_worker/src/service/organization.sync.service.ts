import { NANGO_CONFIG, SERVICE_CONFIG } from '@/conf'
import { Edition, Entity, IOrganization, PlatformType } from '@crowd/types'
import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { IntegrationRepository } from '@/repo/integration.repo'
import {
  IBatchCreateOrganizationsResult,
  IIntegrationProcessRemoteSyncContext,
  INTEGRATION_SERVICES,
} from '@crowd/integrations'
import { OrganizationRepository } from '@/repo/organization.repo'
import { IDbIntegration } from '@/repo/integration.data'

export class OrganizationSyncService extends LoggerBase {
  private readonly organizationRepo: OrganizationRepository
  private readonly integrationRepo: IntegrationRepository

  constructor(store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.integrationRepo = new IntegrationRepository(store, this.log)
    this.organizationRepo = new OrganizationRepository(store, this.log)
  }

  public async syncOrganization(
    tenantId: string,
    integrationId: string,
    organizationId: string,
  ): Promise<void> {
    const integration = await this.integrationRepo.findById(integrationId)

    const organization = await this.organizationRepo.findOrganization(organizationId, tenantId)

    const oranizationsToCreate = []
    const organizationsToUpdate = []

    if (organization.attributes?.sourceId?.[integration.platform]) {
      organizationsToUpdate.push(organization)
    } else {
      oranizationsToCreate.push(organization)
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

      const newOrganizations = await service.processSyncRemote<IOrganization>(
        oranizationsToCreate,
        organizationsToUpdate,
        Entity.ORGANIZATIONS,
        context,
      )

      for (const newOrganization of newOrganizations as IBatchCreateOrganizationsResult[]) {
        await this.organizationRepo.setIntegrationSourceId(
          newOrganization.organizationId,
          integration.platform as PlatformType,
          newOrganization.sourceId,
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

    const isMultiSegment = SERVICE_CONFIG().edition === Edition.LFX

    const segmentId = isMultiSegment ? integration.segmentId : undefined

    let markedOrganizations
    let offset

    do {
      const organizationsToCreate: IOrganization[] = []
      const organizationsToUpdate: IOrganization[] = []

      offset = markedOrganizations ? offset + batchSize : 0

      markedOrganizations = await this.organizationRepo.findMarkedOrganizations(
        tenantId,
        integration.platform as PlatformType,
        segmentId,
        batchSize,
        offset,
      )

      for (const organizationToSync of markedOrganizations) {
        this.log.trace(
          `Syncing organization ${organizationToSync.id} to ${integration.platform} remote!`,
        )

        const organization = await this.organizationRepo.findOrganization(
          organizationToSync.id,
          tenantId,
        )

        if (organization.attributes?.sourceId?.[integration.platform]) {
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

        const newOrganizations = await service.processSyncRemote<IOrganization>(
          organizationsToCreate,
          organizationsToUpdate,
          Entity.ORGANIZATIONS,
          context,
        )

        for (const newOrganization of newOrganizations as IBatchCreateOrganizationsResult[]) {
          await this.organizationRepo.setIntegrationSourceId(
            newOrganization.organizationId,
            integration.platform as PlatformType,
            newOrganization.sourceId,
          )
        }
      } else {
        this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
      }
    } while (markedOrganizations.length > 0)
  }
}
