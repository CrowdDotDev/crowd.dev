import GitHubWebhook from '../webhooks/github'

export default async function githubWebhookWorker(req) {
  GitHubWebhook.verify(req)
  const result = await new GitHubWebhook(req.headers['x-github-event'], JSON.parse(req.body)).main()
  return result
}
