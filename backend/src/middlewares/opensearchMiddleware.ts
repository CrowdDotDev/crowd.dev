import { Client } from '@opensearch-project/opensearch'

export function opensearchMiddleware(cli: Client) {
  return async (req, res, next) => {
    req.opensearch = cli
    next()
  }
}
