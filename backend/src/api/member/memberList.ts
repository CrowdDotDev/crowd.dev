import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import MemberService from '../../services/memberService'
import track from '../../segment/track'

/**
 * GET /tenant/{tenantId}/member
 * @summary List members
 * @tag Members
 * @security Bearer
 * @description Get a list of members with filtering, sorting and offsetting.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @queryParam {MemberType} [filter[type]] - Type: member or lookalike.
 * @queryParam {string} [filter[username]] - Filter by username. It will match any value in the object.
 * @queryParam {string} [filter[platform]] - Filter by any field in the username object having the platform.
 * @queryParam {MemberScore} [filter[scoreRange]] - Score range. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {string} [filter[organisation]] - Filter by organisation.
 * @queryParam {string} [filter[location]] - Filter by first location.
 * @queryParam {string} [filter[email]] - Filter by email.
 * @queryParam {string} [filter[joinedAtRange]] - joinedAt range. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {string} [filter[createdAtRange]] - createdAt lower range. If you want a range, send this parameter twice with [min] and [max]. If you send it once it will be interpreted as a lower bound.
 * @queryParam {MemberSort} [orderBy] - Sort the results. Default joinedAt_DESC.
 * @queryParam {number} [offset] - Skip the first n results. Default 0.
 * @queryParam {number} [limit] - Limit the number of results. Default 50.
 * @response 200 - Ok
 * @responseContent {MemberList} 200.application/json
 * @responseExample {MemberList} 200.application/json.Members
 * @response 401 - Unauthorized
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.memberRead)
    const payload = await new MemberService(req).findAndCountAll(req.query)

    if (req.query.filter && Object.keys(req.query.filter).length > 1) {
      // the condition is length > 1 because we always use a filter here because of lookalike members
      track('Members Filtered', { filter: req.query.filter }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
