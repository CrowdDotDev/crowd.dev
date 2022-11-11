import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'
import PermissionChecker from '../../services/user/permissionChecker'

/**
 * GET /tenant/{tenantId}/note/{id}
 * @summary Find a note
 * @tag Notes
 * @security Bearer
 * @description Find a note by ID.
 * @pathParam {string} tenantId - Your workspace/tenant ID.
 * @pathParam {string} id - The ID of the note.
 * @response 200 - Ok
 * @responseContent {NoteResponse} 200.application/json
 * @responseExample {Note} 200.application/json.Note
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteRead)

  const payload = await new NoteService(req).findById(req.params.id)

  await req.responseHandler.success(req, res, payload)
}
