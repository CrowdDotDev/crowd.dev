import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

/**
 * POST /tenant/{tenantId}/note
 * @summary Create a note
 * @tag Notes
 * @security Bearer
 * @description Create a note
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @bodyContent {NoteNoId} application/json
 * @response 200 - Ok
 * @responseContent {Note} 200.application/json
 * @responseExample {Note} 200.application/json.Note
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteCreate)

  const payload = await new NoteService(req).create(req.body)

  track('Note Created', { ...req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
