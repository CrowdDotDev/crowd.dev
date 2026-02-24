import type { Actor } from '@/types/api'

declare global {
  namespace Express {
    interface Request {
      actor: Actor
    }
  }
}
