import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
    
    
    
    app.post(`/tenant/:tenantId/segment/projectGroup`, safeWrap(require('./segmentCreateProjectGroup').default))
    app.post(`/tenant/:tenantId/segment/project`, safeWrap(require('./segmentCreateProject').default))
    app.post(`/tenant/:tenantId/segment/subproject`, safeWrap(require('./segmentCreateSubproject').default))
    
    // query all segments
    app.post(`/tenant/:tenantId/segment/query`, safeWrap(require('./segmentQuery').default))
    
    // get segment by id
    app.get(`/tenant/:tenantId/segment/projectGroup/:id`, safeWrap(require('./segmentFind').default))

    app.put(`/tenant/:tenantId/segment/:id`, safeWrap(require('./segmentUpdate').default))


}
