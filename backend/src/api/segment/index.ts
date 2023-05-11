import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
    // app.post(`/tenant/:tenantId/report`, safeWrap(require('./reportCreate').default))
    // app.post(`/tenant/:tenantId/report/query`, safeWrap(require('./reportQuery').default))
    // app.put(`/tenant/:tenantId/report/:id`, safeWrap(require('./reportUpdate').default))
    // app.post(`/tenant/:tenantId/report/:id/duplicate`, safeWrap(require('./reportDuplicate').default))
    // app.post(`/tenant/:tenantId/report/import`, safeWrap(require('./reportImport').default))
    // app.delete(`/tenant/:tenantId/report`, safeWrap(require('./reportDestroy').default))
    // app.get(
    //     `/tenant/:tenantId/report/autocomplete`,
    //     safeWrap(require('./reportAutocomplete').default),
    // )
    app.post(`/tenant/:tenantId/segment/projectGroup`, safeWrap(require('./segmentCreateProjectGroup').default))
    app.post(`/tenant/:tenantId/segment/project`, safeWrap(require('./segmentCreateProject').default))
    app.post(`/tenant/:tenantId/segment/subproject`, safeWrap(require('./segmentCreateSubproject').default))
    app.post(`/tenant/:tenantId/segment/query`, safeWrap(require('./segmentQuery').default))
    app.get(`/tenant/:tenantId/segment/:id`, safeWrap(require('./segmentFind').default))
}
