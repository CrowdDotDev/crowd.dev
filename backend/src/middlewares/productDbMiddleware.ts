import { DbConnection } from '@crowd/data-access-layer/src/database'

export function productDatabaseMiddleware(db: DbConnection) {
  return async (req, res, next) => {
    req.productDb = db
    next()
  }
}
