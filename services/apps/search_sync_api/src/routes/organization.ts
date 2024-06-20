import express from 'express'
import { OrganizationSyncService } from '@crowd/opensearch'
import { ApiRequest } from '../middleware'
import { asyncWrap } from '../middleware/error'
import { SERVICE_CONFIG } from '../conf'

const router = express.Router()
const serviceConfig = SERVICE_CONFIG()

router.post(
  '/sync/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )
    const { organizationIds, segmentIds } = req.body
    try {
      req.log.trace(`Calling organizationSyncService.syncOrganizations for ${organizationIds}`)
      await organizationSyncService.syncOrganizations(organizationIds, segmentIds)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/sync/tenant/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { tenantId } = req.body
    try {
      req.log.trace(
        `Calling organizationSyncService.syncTenantOrganizations for tenant ${tenantId}`,
      )
      await organizationSyncService.syncTenantOrganizations(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/tenant/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { tenantId } = req.body
    try {
      req.log.trace(
        `Calling organizationSyncService.cleanupOrganizationIndex for tenant ${tenantId}`,
      )
      await organizationSyncService.cleanupOrganizationIndex(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/organization',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { organizationId } = req.body
    try {
      req.log.trace(
        `Calling organizationSyncService.removeOrganization for organization ${organizationId}`,
      )
      await organizationSyncService.removeOrganization(organizationId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
