import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(
    `/tenant/:tenantId/segment/projectGroup`,
    safeWrap(require('./segmentCreateProjectGroup').default),
  )
  app.post(`/tenant/:tenantId/segment/project`, safeWrap(require('./segmentCreateProject').default))
  app.post(
    `/tenant/:tenantId/segment/subproject`,
    safeWrap(require('./segmentCreateSubproject').default),
  )

  // query all project groups
  app.post(
    `/tenant/:tenantId/segment/projectGroup/query`,
    safeWrap(require('./segmentProjectGroupQuery').default),
  )

  // query all projects
  app.post(
    `/tenant/:tenantId/segment/project/query`,
    safeWrap(require('./segmentProjectQuery').default),
  )

  // query all subprojects
  app.post(
    `/tenant/:tenantId/segment/subproject/query`,
    safeWrap(require('./segmentSubprojectQuery').default),
  )

  // get segment by id
  app.get(`/tenant/:tenantId/segment/:segmentId`, safeWrap(require('./segmentFind').default))
  app.put(`/tenant/:tenantId/segment/:segmentId`, safeWrap(require('./segmentUpdate').default))

  // app.get(`/tenant/:tenantId/segment/projectGroup/:id`, safeWrap(require('./segmentFind').default))
  // app.get(`/tenant/:tenantId/segment/project/:id`, safeWrap(require('./segmentFind').default))
  // app.get(`/tenant/:tenantId/segment/subproject/:id`, safeWrap(require('./segmentFind').default))
}
