import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/organization`, safeWrap(require('./organizationCreate').default))
  app.post(`/tenant/:tenantId/organization/query`, safeWrap(require('./organizationQuery').default))
  app.put(`/tenant/:tenantId/organization/:id`, safeWrap(require('./organizationUpdate').default))
  app.post(
    `/tenant/:tenantId/organization/import`,
    safeWrap(require('./organizationImport').default),
  )
  app.delete(`/tenant/:tenantId/organization`, safeWrap(require('./organizationDestroy').default))
  app.get(
    `/tenant/:tenantId/organization/autocomplete`,
    safeWrap(require('./organizationAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/organization`, safeWrap(require('./organizationList').default))
  app.get(`/tenant/:tenantId/organization/:id`, safeWrap(require('./organizationFind').default))

  app.put(
    `/tenant/:tenantId/organization/:organizationId/merge`,
    safeWrap(require('./organizationMerge').default),
  )

  app.get(
    `/tenant/:tenantId/org/organization-merge-suggestions`,
    safeWrap(require('./organizationGenerateMergeMembers').default),
  )
  // app.put(
  //   `/tenant/:tenantId/organization/:organizationId/no-merge`,
  //   safeWrap(require('./organizationNoMerge').default),
  // )
}
