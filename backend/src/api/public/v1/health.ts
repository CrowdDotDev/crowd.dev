import type { Response } from 'express'

import type { ApiRequest } from '../../../types/api'

export default function getHealth(req: ApiRequest, res: Response): void {
  res.status(200).json({
    status: 'ok',
    caller: {
      id: req.caller.id,
      type: req.caller.type,
    },
  })
}
