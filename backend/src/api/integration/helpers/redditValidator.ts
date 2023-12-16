import axios from 'axios'
import { Error400 } from '@crowd/common'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'
import track from '../../../segment/track'

export default async (req, res) => {
  new PermissionChecker(req).validateHasAny([
    Permissions.values.integrationCreate,
    Permissions.values.integrationEdit,
  ])

  if (req.query.subreddit) {
    try {
      const result = await axios.get(
        `https://www.reddit.com/r/${req.query.subreddit}/new.json?limit=1`,
      )
      if (
        result.status === 200 &&
        result.data.data.children &&
        result.data.data.children.length > 0
      ) {
        track(
          'Reddit: subreddit input',
          {
            subreddit: req.query.subreddit,
            valid: true,
          },
          { ...req },
        )
        return req.responseHandler.success(req, res, result.data.data.children)
      }
    } catch (e) {
      track(
        'Reddit: subreddit input',
        {
          subreddit: req.query.subreddit,
          valid: false,
        },
        { ...req },
      )
      return req.responseHandler.error(req, res, new Error400(req.language))
    }
  }
  track(
    'Reddit: subreddit input',
    {
      subreddit: req.query.subreddit,
      valid: false,
    },
    { ...req },
  )
  return req.responseHandler.error(req, res, new Error400(req.language))
}
