import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'
import { FeatureFlag } from '../../types/common'

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
  app.get(
    `/tenant/:tenantId/member/autocomplete`,
    safeWrap(require('./memberAutocomplete').default),
  )
  app.get(
    `/tenant/:tenantId/member/orautocomplete`,
    safeWrap(require('./memberAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/member`, safeWrap(require('./memberList').default))
  app.get(`/tenant/:tenantId/member/active`, safeWrap(require('./memberActiveList').default))
  app.get(`/tenant/:tenantId/member/:id`, safeWrap(require('./memberFind').default))
  app.get(`/tenant/:tenantId/member/github/:id`, 
  featureFlagMiddleware(FeatureFlag.FIND_GITHUB, 'errors.featureFlag.notEnabled'),
  safeWrap(require('./memberFindGithub').default))
  app.put(`/tenant/:tenantId/member/:memberId/merge`, safeWrap(require('./memberMerge').default))
  app.put(
    `/tenant/:tenantId/member/:memberId/no-merge`,
    safeWrap(require('./memberNotMerge').default),
  )
  app.patch(`/tenant/:tenantId/member`, safeWrap(require('./memberUpdateBulk').default))
}
