import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'
import PermissionChecker from '../../services/user/permissionChecker'
import track from '../../segment/track'

/**
 * DELETE /tenant/{tenantId}/note/{id}
 * @summary Delete a note
 * @tag Notes
 * @security Bearer
 * @description Delete a note.
 * @pathParam {string} tenantId - Your workspace/tenant ID
 * @pathParam {string} id - The ID of the note
 * @response 200 - Ok
 * @response 401 - Unauthorized
 * @response 404 - Not found
 * @response 429 - Too many requests
 */
export default async (req, res) => {
  new PermissionChecker(req).validateHas(Permissions.values.noteDestroy)

  await new NoteService(req).destroyAll(req.query.ids)

  const payload = true

  track('Note Destroyed', { noteIds: req.query.ids }, { ...req })

  await req.responseHandler.success(req, res, payload)
}
