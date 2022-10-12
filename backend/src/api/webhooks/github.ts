import githubWebhookWorker from '../../serverless/integrations/workers/githubWebhookWorker'
import ApiResponseHandler from '../apiResponseHandler'

export default async (req, res) => {
  try {
    const out = await githubWebhookWorker(req)
    let status = 200
    if (out.status === 204) {
      status = 204
    }
    await ApiResponseHandler.success(req, res, out, status)
  } catch (err) {
    await ApiResponseHandler.error(req, res, err)
  }
}
