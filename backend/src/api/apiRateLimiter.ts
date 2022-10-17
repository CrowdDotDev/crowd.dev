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
