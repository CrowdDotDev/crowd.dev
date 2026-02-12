import type { Response } from 'express'

import type { ApiRequest } from '../../../types/api'

export default function getHealth(req: ApiRequest, res: Response): void {
  res.status(200).json({
    status: 'ok',
    actor: {
      id: req.actor.id,
      type: req.actor.type,
    },
  })
}
