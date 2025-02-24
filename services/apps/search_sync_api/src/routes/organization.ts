import express from 'express'

import { OrganizationSyncService } from '@crowd/opensearch'

import { ApiRequest } from '../middleware'
import { asyncWrap } from '../middleware/error'

const router = express.Router()

const syncService = (req: ApiRequest): OrganizationSyncService =>
  new OrganizationSyncService(req.qdbStore, req.pgStore, req.opensearch, req.log)

router.post(
  '/sync/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = syncService(req)
    const { organizationIds, withAggs } = req.body
    try {
      req.log.info(
        `Calling organizationSyncService.syncOrganizations for ${organizationIds}, withAggs: ${withAggs}`,
      )
      await organizationSyncService.syncOrganizations(organizationIds, { withAggs })
      res.sendStatus(200)
    } catch (error) {
      req.log.error(error)
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/organizations',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = syncService(req)

    try {
      req.log.trace(`Calling organizationSyncService.cleanupOrganizationIndex`)
      await organizationSyncService.cleanupOrganizationIndex()
      res.sendStatus(200)
    } catch (error) {
      req.log.error(error)
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/organization',
  asyncWrap(async (req: ApiRequest, res) => {
    const organizationSyncService = syncService(req)

    const { organizationId } = req.body
    try {
      req.log.trace(
        `Calling organizationSyncService.removeOrganization for organization ${organizationId}`,
      )
      await organizationSyncService.removeOrganization(organizationId)
      res.sendStatus(200)
    } catch (error) {
      req.log.error(error)
      res.status(500).send(error.message)
    }
  }),
)

export default router
