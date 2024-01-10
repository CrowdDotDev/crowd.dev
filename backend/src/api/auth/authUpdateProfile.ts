import { Error403 } from '@crowd/common'
import AuthProfileEditor from '../../services/auth/authProfileEditor'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    throw new Error403(req.language)
  }

  const editor = new AuthProfileEditor(req)

  await editor.execute(req.body)

  const payload = true

  await req.responseHandler.success(req, res, payload)
}
