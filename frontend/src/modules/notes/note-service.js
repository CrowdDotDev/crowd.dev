import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class NoteService {
  static create(data) {
    const tenantId = AuthCurrentTenant.get(true)

    return authAxios
      .post(`/tenant/${tenantId}/note`, data)
      .then((response) => {
        return response.data
      })
  }

  static update(id, data) {
    const tenantId = AuthCurrentTenant.get(true)

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

    const tenantId = AuthCurrentTenant.get(true)

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

    const tenantId = AuthCurrentTenant.get(true)

    return authAxios
      .post(`/tenant/${tenantId}/note/query`, body)
      .then((response) => {
        return response.data
      })
  }
}
