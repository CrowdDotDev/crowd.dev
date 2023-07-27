import stripeWebhookWorker from '../integrations/workers/stripeWebhookWorker'

export default async (req, res) => {
  const out = await stripeWebhookWorker(req)
  let status = 200
  if (out.status === 204) {
    status = 204
  }
  await req.responseHandler.success(req, res, out, status)
}
