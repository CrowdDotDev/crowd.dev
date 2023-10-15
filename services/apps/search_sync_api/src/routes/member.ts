import express from 'express'
import { MemberSyncService } from '@crowd/opensearch'

const router = express.Router()

router.post('/sync/members', async (req, res) => {
  const memberSyncService = new MemberSyncService(
    req.redisClient,
    req.dbStore,
    req.opensearch,
    req.log,
  )
  const { memberIds } = req.body
  try {
    await memberSyncService.syncMembers(memberIds)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post('/sync/tenant/members', async (req, res) => {
  const memberSyncService = new MemberSyncService(
    req.redisClient,
    req.dbStore,
    req.opensearch,
    req.log,
  )

  const { tenantId } = req.body
  try {
    await memberSyncService.syncTenantMembers(tenantId)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post('/sync/organization/members', async (req, res) => {
  const memberSyncService = new MemberSyncService(
    req.redisClient,
    req.dbStore,
    req.opensearch,
    req.log,
  )

  const { organizationId } = req.body
  try {
    await memberSyncService.syncOrganizationMembers(organizationId)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.delete('/cleanup/tenant/members', async (req, res) => {
  const memberSyncService = new MemberSyncService(
    req.redisClient,
    req.dbStore,
    req.opensearch,
    req.log,
  )

  const { tenantId } = req.body
  try {
    await memberSyncService.cleanupMemberIndex(tenantId)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.delete('/cleanup/members', async (req, res) => {
  const memberSyncService = new MemberSyncService(
    req.redisClient,
    req.dbStore,
    req.opensearch,
    req.log,
  )

  const { memberId } = req.body
  try {
    await memberSyncService.removeMember(memberId)
    res.sendStatus(200)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

export default router
