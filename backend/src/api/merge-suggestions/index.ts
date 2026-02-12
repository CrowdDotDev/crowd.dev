import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/membersToMerge`, safeWrap(require('./membersToMergeList').default))
  app.post(`/organizationsToMerge`, safeWrap(require('./organizationsToMergeList').default))
}
