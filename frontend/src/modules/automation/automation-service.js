import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class AutomationService {
  static async update(id, data) {
    const body = {
      id,
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/automation/${id}`,
      body
    )

    return response.data
  }

  static async destroy(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/automation/${id}`
    )

    return response.data
  }

  static async destroyAll(ids) {
    const params = {
      ids
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/automation`,
      {
        params
      }
    )

    return response.data
  }

  static async publishAll(ids) {
    const tenantId = AuthCurrentTenant.get()

    for (const id of ids) {
      const body = {
        id,
        data: {
          state: true
        }
      }
      await authAxios.put(
        `/tenant/${tenantId}/automation/${id}`,
        body
      )
    }
  }

  static async unpublishAll(ids) {
    const tenantId = AuthCurrentTenant.get()

    for (const id of ids) {
      const body = {
        id,
        data: {
          state: false
        }
      }
      await authAxios.put(
        `/tenant/${tenantId}/automation/${id}`,
        body
      )
    }
  }

  static async create(data) {
    const body = {
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/automation`,
      body
    )

    return response.data
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/automation/${id}`
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

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/automation`,
      {
        params
      }
    )

    return response.data
  }

  static async listAutomationExecutions(
    automationId,
    orderBy,
    limit,
    offset
  ) {
    const params = {
      orderBy,
      limit,
      offset
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/automation/${automationId}/executions`,
      {
        params
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
      `/tenant/${tenantId}/automation/autocomplete`,
      {
        params
      }
    )

    return response.data
  }
}
