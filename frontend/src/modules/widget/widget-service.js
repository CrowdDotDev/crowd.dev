import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class WidgetService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/widget/${id}`,
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
      `/tenant/${tenantId}/widget`,
      {
        params
      }
    )

    return response.data
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/widget`,
      data
    )

    return response.data
  }

  static async find(id) {
    const sampleTenant =
      AuthCurrentTenant.getSampleTenantData()
    const tenantId =
      sampleTenant?.id || AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/widget/${id}`,
      {
        token: sampleTenant?.token
      }
    )

    return response.data
  }

  static async list(filter, orderBy, limit, offset) {
    const params = {
      filter,
      orderBy,
      limit,
      offset
    }

    const sampleTenant =
      AuthCurrentTenant.getSampleTenantData()
    const tenantId =
      sampleTenant?.id || AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/widget`,
      {
        params,
        token: sampleTenant?.token
      }
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
      `/tenant/${tenantId}/widget/autocomplete`,
      {
        params
      }
    )

    return response.data
  }

  static async getCubeToken() {
    const sampleTenant =
      AuthCurrentTenant.getSampleTenantData()
    const tenantId =
      sampleTenant?.id || AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/cubejs/auth`,
      {
        token: sampleTenant?.token
      }
    )

    return response.data
  }
}
