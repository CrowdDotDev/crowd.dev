import { FeatureFlag } from '@crowd/types'
import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/member/query`, safeWrap(require('./memberQuery').default))

  app.post(
    `/tenant/:tenantId/member/export`,
    featureFlagMiddleware(FeatureFlag.CSV_EXPORT, 'errors.csvExport.planLimitExceeded'),
    safeWrap(require('./memberExport').default),
  )

  app.post(`/tenant/:tenantId/member`, safeWrap(require('./memberCreate').default))
  app.put(`/tenant/:tenantId/member/:id`, safeWrap(require('./memberUpdate').default))
  app.post(`/tenant/:tenantId/member/import`, safeWrap(require('./memberImport').default))
  app.delete(`/tenant/:tenantId/member`, safeWrap(require('./memberDestroy').default))
  app.post(
    `/tenant/:tenantId/member/autocomplete`,
    safeWrap(require('./memberAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/member/active`, safeWrap(require('./memberActiveList').default))
  app.get(`/tenant/:tenantId/member/:id`, safeWrap(require('./memberFind').default))
  app.get(
    `/tenant/:tenantId/member/github/:id`,
    featureFlagMiddleware(FeatureFlag.FIND_GITHUB, 'errors.featureFlag.notEnabled'),
    safeWrap(require('./memberFindGithub').default),
  )
  app.put(`/tenant/:tenantId/member/:memberId/merge`, safeWrap(require('./memberMerge').default))

  app.post(
    `/tenant/:tenantId/member/:memberId/unmerge/preview`,
    safeWrap(require('./memberUnmergePreview').default),
  )

  app.post(
    `/tenant/:tenantId/member/:memberId/unmerge`,
    safeWrap(require('./memberUnmerge').default),
  )

  app.put(
    `/tenant/:tenantId/member/:memberId/no-merge`,
    safeWrap(require('./memberNotMerge').default),
  )
  app.patch(`/tenant/:tenantId/member`, safeWrap(require('./memberUpdateBulk').default))

  require('./identity').default(app)
  require('./organization').default(app)
  require('./attributes').default(app)
  require('./affiliation').default(app)
}
