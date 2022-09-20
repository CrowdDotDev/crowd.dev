import PermissionChecker from '../../services/user/permissionChecker'
import ApiResponseHandler from '../apiResponseHandler'
import Permissions from '../../security/permissions'
import NoteService from '../../services/noteService'
import track from '../../segment/track'

// /**
//  * POST /tenant/{tenantId}/note
//  * @summary Create or update an note
//  * @tag Activities
//  * @security Bearer
//  * @description Create or update an note. Existence is checked by sourceId and tenantId.
//  * @pathParam {string} tenantId - Your workspace/tenant ID
//  * @bodyContent {NoteUpsertInput} application/json
//  * @response 200 - Ok
//  * @responseContent {Note} 200.application/json
//  * @responseExample {NoteUpsert} 200.application/json.Note
//  * @response 401 - Unauthorized
//  * @response 404 - Not found
//  * @response 429 - Too many requests
//  */
export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(Permissions.values.noteRead)

    const payload = await new NoteService(req).query(req.body.data)

    if (req.query.filter && Object.keys(req.query.filter).length > 0) {
      track('Notes Advanced Fitler', { ...payload }, { ...req })
    }

    await ApiResponseHandler.success(req, res, payload)
  } catch (error) {
    await ApiResponseHandler.error(req, res, error)
  }
}
