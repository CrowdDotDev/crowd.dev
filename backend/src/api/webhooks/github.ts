import githubWebhookWorker from '../../serverless/integrations/workers/githubWebhookWorker'

export default async (req, res) => {
  const out = await githubWebhookWorker(req)
  let status = 200
  if (out.status === 204) {
    status = 204
  }
  await req.responseHandler.success(req, res, out, status)
}
