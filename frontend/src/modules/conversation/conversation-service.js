import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import buildApiPayload from '@/shared/filter/helpers/build-api-payload'
export class ConversationService {
  static async update(id, data) {
    const body = {
      id,
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/conversation/${id}`,
      body
    )

    return response.data
  }

  static async destroyAll(ids) {
    const params = {
      ids
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/conversation`,
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
          published: true
        }
      }
      await authAxios.put(
        `/tenant/${tenantId}/conversation/${id}`,
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
          published: false
        }
      }
      await authAxios.put(
        `/tenant/${tenantId}/conversation/${id}`,
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
      `/tenant/${tenantId}/conversation`,
      body
    )

    return response.data
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/conversation/${id}`
    )

    return response.data
  }

  static async list(filter, orderBy, limit, offset) {
    const body = {
      filter: buildApiPayload(filter),
      orderBy,
      limit,
      offset
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/conversation/query`,
      body
    )

    return response.data
  }

  static async query(filter, orderBy, limit, offset) {
    const body = {
      filter,
      orderBy,
      limit,
      offset
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/conversation/query`,
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
      `/tenant/${tenantId}/conversation/autocomplete`,
      {
        params
      }
    )

    return response.data
  }
}
