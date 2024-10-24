import { FeatureFlag } from '@crowd/types'

import { safeWrap } from '../../middlewares/errorMiddleware'
import { featureFlagMiddleware } from '../../middlewares/featureFlagMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/organization`, safeWrap(require('./organizationCreate').default))
  app.post(`/tenant/:tenantId/organization/query`, safeWrap(require('./organizationQuery').default))
  app.put(`/tenant/:tenantId/organization/:id`, safeWrap(require('./organizationUpdate').default))
  app.post(
    `/tenant/:tenantId/organization/import`,
    safeWrap(require('./organizationImport').default),
  )
  app.delete(`/tenant/:tenantId/organization`, safeWrap(require('./organizationDestroy').default))
  app.post(
    `/tenant/:tenantId/organization/autocomplete`,
    safeWrap(require('./organizationAutocomplete').default),
  )
  app.get(
    `/tenant/:tenantId/organization/active`,
    safeWrap(require('./organizationActiveList').default),
  )
  app.get(`/tenant/:tenantId/organization/:id`, safeWrap(require('./organizationFind').default))

  app.put(
    `/tenant/:tenantId/organization/:organizationId/merge`,
    safeWrap(require('./organizationMerge').default),
  )

  app.put(
    `/tenant/:tenantId/organization/:organizationId/no-merge`,
    safeWrap(require('./organizationNotMerge').default),
  )

  app.post(
    `/tenant/:tenantId/organization/:organizationId/unmerge/preview`,
    safeWrap(require('./organizationUnmergePreview').default),
  )

  app.post(
    `/tenant/:tenantId/organization/:organizationId/unmerge`,
    safeWrap(require('./organizationUnmerge').default),
  )

  app.post(
    `/tenant/:tenantId/organization/export`,
    featureFlagMiddleware(FeatureFlag.CSV_EXPORT, 'errors.csvExport.planLimitExceeded'),
    safeWrap(require('./organizationExport').default),
  )

  app.post(`/tenant/:tenantId/organization/id`, safeWrap(require('./organizationByIds').default))

  // list organizations across all segments
  app.post(`/tenant/:tenantId/organization/list`, safeWrap(require('./organizationList').default))

  app.post(
    `/tenant/:tenantId/organization/:id/data-issue`,
    safeWrap(require('./organizationDataIssueCreate').default),
  )
}
