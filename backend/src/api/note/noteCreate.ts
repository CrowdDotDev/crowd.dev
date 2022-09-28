import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'

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
  try {
    new PermissionChecker(req).validateHas(Permissions.values.noteCreate)

    const payload = await new NoteService(req).create(req.body)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
