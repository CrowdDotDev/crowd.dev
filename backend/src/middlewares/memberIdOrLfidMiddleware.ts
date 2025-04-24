import { validateUUID } from '@crowd/common'
import { lfidToMemberId } from '@crowd/data-access-layer'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

/**
 * Middleware to resolve `memberIdOrLfid` route param to a member UUID.
 *
 * - If a memberId (uuid), sets `req.memberId` and continues.
 * - If an lfid (used by external services), resolves to memberId via db lookup.
 * Used in routes that accept either type for member identification.
 */
export async function memberIdOrLfidMiddleware(req, res, next) {
  const identifier = req.params.memberIdOrLfid
  const qx = SequelizeRepository.getQueryExecutor({ database: req.database, ...req })

  if (validateUUID(identifier)) {
    req.memberId = identifier
    return next()
  }

  const memberId = await lfidToMemberId(qx, identifier)
  if (!memberId) {
    return res.status(404).json({ error: 'Member not found for given lfid!' })
  }

  req.memberId = memberId
  return next()
}