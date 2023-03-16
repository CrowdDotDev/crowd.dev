import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class NoteService {
  static create(data) {
    const tenantId = AuthCurrentTenant.get()

    return authAxios
      .post(`/tenant/${tenantId}/note`, data)
      .then((response) => {
        return response.data
      })
  }

  static update(id, data) {
    const tenantId = AuthCurrentTenant.get()

    return authAxios
      .put(`/tenant/${tenantId}/note/${id}`, data)
      .then((response) => {
        return response.data
      })
  }

  static destroyAll(ids) {
    const params = {
      ids
    }

    const tenantId = AuthCurrentTenant.get()

    return authAxios
      .delete(`/tenant/${tenantId}/note`, {
        params
      })
      .then((response) => {
        return response.data
      })
  }

  static list(filter, orderBy, limit, offset) {
    const body = {
      filter,
      orderBy,
      limit,
      offset
    }

    const sampleTenant =
      AuthCurrentTenant.getSampleTenantData()
    const tenantId =
      sampleTenant?.id || AuthCurrentTenant.get()

    return authAxios
      .post(`/tenant/${tenantId}/note/query`, body, {
        headers: {
          Authorization: sampleTenant?.token
        }
      })
      .then((response) => {
        return response.data
      })
  }
}
