import type { Logger } from '@crowd/logging'
import type { Client as TemporalClient } from '@crowd/temporal'

import type { Actor } from '@/types/api'

declare global {
  namespace Express {
    interface Request {
      actor: Actor
      temporal: TemporalClient
      log: Logger
    }
  }
}
