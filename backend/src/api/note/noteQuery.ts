import Permissions from '../../security/permissions'
import track from '../../segment/track'
import NoteService from '../../services/noteService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * POST /tenant/{tenantId}/note/query
 * @summary Query notes
 * @tag Notes
 * @security Bearer
 * @description Query notes. It accepts filters, sorting options and pagination.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {NoteQuery} application/json
 * @response 200 - Ok
 * @responseContent {NoteList} 200.application/json
 * @responseExample {NoteList} 200.application/json.Note
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteRead)

  const payload = await new NoteService(req).query(req.body)

  if (req.body?.filter && Object.keys(req.body.filter).length > 0) {
    track('Notes Advanced Filter', { ...req.body }, { ...req })
  }

  await req.responseHandler.success(req, res, payload)
}
