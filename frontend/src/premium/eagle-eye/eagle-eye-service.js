import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import buildApiPayload from '@/shared/filter/helpers/build-api-payload'

export class EagleEyeService {
  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/eagleEyeContent/${id}`
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
      `/tenant/${tenantId}/eagleEyeContent/query`,
      body
    )

    return response.data
  }

  static async populate(keywords) {
    const data = {
      exactKeywords: keywords.filter((k) => {
        return k[0] === '"' && k[k.length - 1] === '"'
      }).map((s) => s.replaceAll('"', '')),
      keywords: keywords.filter((k) => {
        return k[0] !== '"' && k[k.length - 1] !== '"'
      })
    }

    const tenantId = AuthCurrentTenant.get()

    await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent`,
      data
    )
  }

  static async exclude(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/${id}`,
      {
        status: 'rejected'
      }
    )

    return response.data
  }

  static async engage(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/${id}`,
      {
        status: 'engaged'
      }
    )

    return response.data
  }

  static async revertExclude(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/${id}`,
      {
        status: null
      }
    )

    return response.data
  }
}
