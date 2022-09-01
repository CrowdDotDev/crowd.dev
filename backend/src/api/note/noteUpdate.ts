import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'

// /**
//  * PUT /tenant/{tenantId}/note/{id}
//  * @summary Update an note
//  * @note Notes
//  * @security Bearer
//  * @description Update a note given an ID.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @pathParam {string} id - The ID of the note
//  * @bodyContent {NoteNoId} application/json
//  * @response 200 - Ok
//  * @responseContent {Note} 200.application/json
//  * @responseExample {Note} 200.application/json.Note
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.noteEdit)

    const payload = await new NoteService(req).update(req.params.id, req.body.data)

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
