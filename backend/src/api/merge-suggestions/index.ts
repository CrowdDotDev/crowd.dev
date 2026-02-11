import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.post(`/membersToMerge`, safeWrap(require('./membersToMergeList').default))
  app.post(`/organizationsToMerge`, safeWrap(require('./organizationsToMergeList').default))
}
