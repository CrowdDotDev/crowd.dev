import rateLimit from 'express-rate-limit'

export function createRateLimiter({
  max,
  windowMs,
  message,
}: {
  max: number
  windowMs: number
  message: string
}) {
  return rateLimit({
    // store: new MongoStore({
    //   uri: getConfig().DATABASE_CONNECTION,
    // }),
    max,
    windowMs,
    message,
    skip: (req) => {
      if (req.method === 'OPTIONS') {
        return true
      }

      if (req.originalUrl.endsWith('/import')) {
        return true
      }

      return false
    },
  })
}
