import express from 'express'
import { OpenSearchService, OrganizationSyncService } from '@crowd/opensearch'
import { ApiRequest } from 'middleware'
import { asyncWrap } from 'middleware/error'
import { OPENSEARCH_CONFIG, SERVICE_CONFIG } from 'conf'

const router = express.Router()
const openSearchConfig = OPENSEARCH_CONFIG()
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
    const { organizationIds } = req.body
    try {
      await organizationSyncService.syncOrganizations(organizationIds)
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
      await organizationSyncService.removeOrganization(organizationId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
