import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import buildApiFilter from '@/shared/filter/helpers/build-api-payload'

export class OrganizationService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${id}`,
      data
    )

    return response.data
  }

  static async destroyAll(ids) {
    const params = {
      ids
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/organization`,
      {
        params
      }
    )

    return response.data
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization`,
      data
    )

    return response.data
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/${id}`
    )

    return response.data
  }

  static async list(
    filter,
    orderBy,
    limit,
    offset,
    buildFilter = true
  ) {
    const body = {
      filter: buildFilter ? buildApiFilter(filter) : filter,
      orderBy,
      limit,
      offset
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/query`,
      body
    )

    return response.data
  }

  static async listAutocomplete(query, limit) {
    const params = {
      query,
      limit
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/autocomplete`,
      {
        params
      }
    )

    return response.data
  }
}
