import express from 'express'
import { ActivitySyncService } from '@crowd/opensearch'
import { ApiRequest } from '../middleware/index'
import { asyncWrap } from 'middleware/error'

const router = express.Router()

router.post(
  '/sync/activities',
  asyncWrap(async (req: ApiRequest, res) => {
    const activitySyncService = new ActivitySyncService(req.dbStore, req.opensearch, req.log)
    const { activityIds } = req.body
    try {
      req.log.trace(`Calling activitySyncService.syncActivities for ${activityIds}`)
      await activitySyncService.syncActivities(activityIds)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/sync/tenant/activities',
  asyncWrap(async (req: ApiRequest, res) => {
    const activitySyncService = new ActivitySyncService(req.dbStore, req.opensearch, req.log)

    const { tenantId } = req.body
    try {
      req.log.trace(`Calling activitySyncService.syncTenantActivities for tenant ${tenantId}`)
      await activitySyncService.syncTenantActivities(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/sync/organization/activities',
  asyncWrap(async (req: ApiRequest, res) => {
    const activitySyncService = new ActivitySyncService(req.dbStore, req.opensearch, req.log)

    const { organizationId } = req.body
    try {
      req.log.trace(
        `Calling activitySyncService.syncOrganizationActivities for organization ${organizationId}`,
      )
      await activitySyncService.syncOrganizationActivities(organizationId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/tenant/activities',
  asyncWrap(async (req: ApiRequest, res) => {
    const activitySyncService = new ActivitySyncService(req.dbStore, req.opensearch, req.log)

    const { tenantId } = req.body
    try {
      req.log.trace(`Calling activitySyncService.cleanupActivityIndex for tenant ${tenantId}`)
      await activitySyncService.cleanupActivityIndex(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/activity',
  asyncWrap(async (req: ApiRequest, res) => {
    const activitySyncService = new ActivitySyncService(req.dbStore, req.opensearch, req.log)

    const { activityId } = req.body
    try {
      req.log.trace(`Calling activitySyncService.removeActivity for activity ${activityId}`)
      await activitySyncService.removeActivity(activityId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
