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
      await activitySyncService.cleanupActivityIndex(activityId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
