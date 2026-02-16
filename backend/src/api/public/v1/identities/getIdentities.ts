import type { Response } from 'express'

import type { ApiRequest } from '@/types/api'

export async function getIdentities(req: ApiRequest, res: Response): Promise<void> {
  res.status(200).json({
    status: 'ok',
    actor: {
      id: req.actor.id,
      type: req.actor.type,
    },
  })
}
