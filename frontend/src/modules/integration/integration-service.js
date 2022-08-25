import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class IntegrationService {
  static async update(id, data) {
    const body = {
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/integration/${id}`,
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
      `/tenant/${tenantId}/integration`,
      {
        params
      }
    )

    return response.data
  }

  static async create(data) {
    const body = {
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/integration`,
      body
    )

    return response.data
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/${id}`
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
      `/tenant/${tenantId}/integration`,
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
      `/tenant/${tenantId}/integration/autocomplete`,
      {
        params
      }
    )

    return response.data
  }

  static async githubConnect(code, installId, setupAction) {
    // Ask backend to connect to GitHub through Oauth.
    // Install_id is the GitHub app installation id.
    const body = {
      installId: installId,
      setupAction: setupAction
    }
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get()
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(
      `/authenticate/${tenantId}/${code}`,
      body
    )
    return response.data
  }

  static async discordConnect(guild_id) {
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get()
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(
      `/discord-authenticate/${tenantId}/${guild_id}`
    )
    return response.data
  }
}
