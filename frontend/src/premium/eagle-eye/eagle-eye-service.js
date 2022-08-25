import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class EagleEyeService {
  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/eagleEyeContent/${id}`
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
      `/tenant/${tenantId}/eagleEyeContent`,
      {
        params
      }
    )

    return response.data
  }

  static async populate(keywords, nDays) {
    const params = {
      keywords,
      nDays
    }

    const tenantId = AuthCurrentTenant.get()

    await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent`,
      {
        data: params
      }
    )
  }

  static async exclude(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/${id}`,
      {
        data: {
          status: 'rejected'
        }
      }
    )

    return response.data
  }

  static async engage(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/${id}`,
      {
        data: {
          status: 'engaged'
        }
      }
    )

    return response.data
  }

  static async revertExclude(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/${id}`,
      {
        data: {
          status: null
        }
      }
    )

    return response.data
  }
}
