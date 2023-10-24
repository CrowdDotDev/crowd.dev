import express from 'express'
import { MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { ApiRequest } from 'middleware'
import { asyncWrap } from 'middleware/error'

const router = express.Router()

router.post(
  '/sync/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.dbStore,
      openSearchService,
      req.log,
    )
    const { memberIds } = req.body

    try {
      await memberSyncService.syncMembers(memberIds)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/sync/tenant/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.dbStore,
      openSearchService,
      req.log,
    )

    const { tenantId } = req.body
    try {
      await memberSyncService.syncTenantMembers(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/sync/organization/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.dbStore,
      openSearchService,
      req.log,
    )

    const { organizationId } = req.body
    try {
      await memberSyncService.syncOrganizationMembers(organizationId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.delete(
  '/cleanup/tenant/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.dbStore,
      openSearchService,
      req.log,
    )

    const { tenantId } = req.body
    try {
      await memberSyncService.cleanupMemberIndex(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.delete(
  '/cleanup/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const openSearchService = new OpenSearchService(req.log)
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.dbStore,
      openSearchService,
      req.log,
    )

    const { memberId } = req.body
    try {
      await memberSyncService.removeMember(memberId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
