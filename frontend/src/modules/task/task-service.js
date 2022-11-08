import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class TaskService {
  static create(data) {
    const tenantId = AuthCurrentTenant.get()

    return authAxios
      .post(`/tenant/${tenantId}/task`, data)
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

    const tenantId = AuthCurrentTenant.get()

    return authAxios
      .post(`/tenant/${tenantId}/task/query`, body)
      .then((response) => {
        return response.data
      })
  }

  static update(id, data) {
    const tenantId = AuthCurrentTenant.get()

    return authAxios
      .put(`/tenant/${tenantId}/task/${id}`, data)
      .then((response) => {
        return response.data
      })
  }
}
