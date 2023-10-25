import express from 'express'
import { OpenSearchService, OrganizationSyncService } from '@crowd/opensearch'
import { ApiRequest } from 'middleware'
import { asyncWrap } from 'middleware/error'

const router = express.Router()

router.post(
  '/sync/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      openSearchService,
      req.log,
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
    const openSearchService = new OpenSearchService(req.log)
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      openSearchService,
      req.log,
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

router.delete(
  '/cleanup/tenant/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      openSearchService,
      req.log,
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

router.delete(
  '/cleanup/organization',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const organizationSyncService = new OrganizationSyncService(
      req.dbStore,
      openSearchService,
      req.log,
    )

    const { organizationId } = req.body
    try {
      await organizationSyncService.cleanupOrganizationIndex(organizationId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
