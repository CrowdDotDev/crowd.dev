import { safeWrap } from '../../middlewares/error.middleware'

export default (app) => {
  app.put(`/settings`, safeWrap(require('./settingsSave').default))
  app.get(`/settings`, safeWrap(require('./settingsFind').default))

  app.get('/settings/activity/types', safeWrap(require('./activityTypeList').default))

  app.post('/settings/activity/types', safeWrap(require('./activityTypeCreate').default))

  app.put('/settings/activity/types/:key', safeWrap(require('./activityTypeUpdate').default))

  app.delete('/settings/activity/types/:key', safeWrap(require('./activityTypeDestroy').default))

  app.post('/settings/members/attributes', safeWrap(require('./memberAttributeCreate').default))
  app.delete(`/settings/members/attributes`, safeWrap(require('./memberAttributeDestroy').default))
  app.put(`/settings/members/attributes/:id`, safeWrap(require('./memberAttributeUpdate').default))
  app.get(`/settings/members/attributes`, safeWrap(require('./memberAttributeList').default))
  app.get(`/settings/members/attributes/:id`, safeWrap(require('./memberAttributeFind').default))
}
