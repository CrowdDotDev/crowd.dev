import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

/**
 * PUT /tenant/{tenantId}/note/{id}
 * @summary Update a note
 * @tag Notes
 * @security Bearer
 * @description Update a note
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the note
 * @bodyContent {NoteInput} application/json
 * @response 200 - Ok
 * @responseContent {Note} 200.application/json
 * @responseExample {Note} 200.application/json.Note
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteEdit)

  const payload = await new NoteService(req).update(req.params.id, req.body)

  track('Note Updated', { id: payload.id, data: req.body }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
