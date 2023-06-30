import { IActiveMemberFilter } from '../../database/repositories/types/memberTypes'
import Error400 from '../../errors/Error400'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/member/active
 * @summary List active members
 * @tag Members
 * @security Bearer
 * @description List active members. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {string} [filter[platforms]] - Filter by activity platforms (comma separated list without spaces)
 * @queryParam {string} [filter[isTeamMember]] - If true we will return just team members, if false we will return just non-team members, if undefined we will return both.
 * @queryParam {string} [filter[isBot]] - If true we will return just members who are bots, if false we will return just non-bot members, if undefined we will return both.
 * @queryParam {string} [filter[isOrganization]] - If true we will return just members who are organizations (such as linkedin organizations that post), if false we will return just non-organization members, if undefined we will return both.
 * @queryParam {string} [filter[activityTimestampFrom]] - Filter by activity timestamp from (required)
 * @queryParam {string} [filter[activityTimestampTo]] - Filter by activity timestamp to (required)
 * @queryParam {string} [filter[activityIsContribution]] - Filter by activities that are contributions
 * @queryParam {string} [orderBy] - How to sort results. Available values: activityCount_DESC, activityCount_ASC, activeDaysCount_DESC, activeDaysCount_ASC (default activityCount_DESC)
 * @queryParam {number} [offset] - Skip the first n results. Default 0.
 * @queryParam {number} [limit] - Limit the number of results. Default 20.
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.memberRead)

  let offset = 0
  if (req.query.offset) {
    offset = parseInt(req.query.offset, 10)
  }
  let limit = 20
  if (req.query.limit) {
    limit = parseInt(req.query.limit, 10)
  }

  if (req.query.filter?.activityTimestampFrom === undefined) {
    throw new Error400(req.language, 'errors.members.activeList.activityTimestampFrom')
  }

  if (req.query.filter?.activityTimestampTo === undefined) {
    throw new Error400(req.language, 'errors.members.activeList.activityTimestampTo')
  }

  const filters: IActiveMemberFilter = {
    platforms:
      req.query.filter?.platforms !== undefined
        ? req.query.filter?.platforms.split(',')
        : undefined,
    isTeamMember:
      req.query.filter?.isTeamMember === undefined
        ? undefined
        : req.query.filter?.isTeamMember === 'true',
    isBot: req.query.filter?.isBot === undefined ? undefined : req.query.filter?.isBot === 'true',
    isOrganization:
      req.query.filter?.isOrganization === undefined
        ? undefined
        : req.query.filter?.isOrganization === 'true',
    activityTimestampFrom: req.query.filter?.activityTimestampFrom,
    activityTimestampTo: req.query.filter?.activityTimestampTo,
    activityIsContribution: req.query.filter?.activityIsContribution === 'true',
  }

  const orderBy = req.query.orderBy || 'activityCount_DESC'

  const payload = await new MemberService(req).findAndCountActive(
    filters,
    offset,
    limit,
    orderBy,
    req.query.segments,
  )

  await req.responseHandler.success(req, res, payload)
}
