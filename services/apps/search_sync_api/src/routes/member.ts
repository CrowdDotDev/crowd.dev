import express from 'express'
import { MemberSyncService } from '@crowd/opensearch'
import { ApiRequest } from '../middleware'
import { asyncWrap } from '../middleware/error'

const router = express.Router()

router.post(
  '/sync/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.pgStore,
      req.qdbStore,
      req.opensearch,
      req.log,
    )

    const { memberIds, segmentIds } = req.body
    try {
      req.log.trace(`Calling memberSyncService.syncMembers for ${memberIds}`)
      await memberSyncService.syncMembers(memberIds, segmentIds)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/sync/tenant/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.pgStore,
      req.qdbStore,
      req.opensearch,
      req.log,
    )

    const { tenantId } = req.body
    try {
      req.log.trace(`Calling memberSyncService.syncTenantMembers for tenant ${tenantId}`)
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
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.pgStore,
      req.qdbStore,
      req.opensearch,
      req.log,
    )

    const { organizationId } = req.body
    try {
      req.log.trace(
        `Calling memberSyncService.syncOrganizationMembers for organization ${organizationId}`,
      )
      await memberSyncService.syncOrganizationMembers(organizationId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/tenant/members',
  asyncWrap(async (req: ApiRequest, res) => {
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.pgStore,
      req.qdbStore,
      req.opensearch,
      req.log,
    )

    const { tenantId } = req.body
    try {
      req.log.trace(`Calling memberSyncService.cleanupMemberIndex for tenant ${tenantId}`)
      await memberSyncService.cleanupMemberIndex(tenantId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

router.post(
  '/cleanup/member',
  asyncWrap(async (req: ApiRequest, res) => {
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.pgStore,
      req.qdbStore,
      req.opensearch,
      req.log,
    )

    const { memberId } = req.body
    try {
      req.log.trace(`Calling memberSyncService.removeMember for ${memberId}`)
      await memberSyncService.removeMember(memberId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
