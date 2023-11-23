import express from 'express'
import { MemberSyncService } from '@crowd/opensearch'
import { ApiRequest } from 'middleware'
import { asyncWrap } from 'middleware/error'
import { SERVICE_CONFIG } from 'conf'

const router = express.Router()
const serviceConfig = SERVICE_CONFIG()

router.post(
  '/sync/members',
  asyncWrap(async (req: ApiRequest, res) => {
    try {
      const memberSyncService = new MemberSyncService(
        req.redisClient,
        req.dbStore,
        req.opensearch,
        req.log,
        serviceConfig,
      )
      const { memberIds } = req.body
      req.log.trace(`[SearchSyncAPI] - Calling memberSyncService.syncMembers for ${memberIds}`)
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
    const memberSyncService = new MemberSyncService(
      req.redisClient,
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { tenantId } = req.body
    try {
      req.log.trace(
        `[SearchSyncAPI] - Calling memberSyncService.syncTenantMembers for tenant ${tenantId}`,
      )
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
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { organizationId } = req.body
    try {
      req.log.trace(
        `[SearchSyncAPI] - Calling memberSyncService.syncOrganizationMembers for organization ${organizationId}`,
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
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { tenantId } = req.body
    try {
      req.log.trace(
        `[SearchSyncAPI] - Calling memberSyncService.cleanupMemberIndex for tenant ${tenantId}`,
      )
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
      req.dbStore,
      req.opensearch,
      req.log,
      serviceConfig,
    )

    const { memberId } = req.body
    try {
      req.log.trace(`[SearchSyncAPI] - Calling memberSyncService.removeMember for ${memberId}`)
      await memberSyncService.removeMember(memberId)
      res.sendStatus(200)
    } catch (error) {
      res.status(500).send(error.message)
    }
  }),
)

export default router
