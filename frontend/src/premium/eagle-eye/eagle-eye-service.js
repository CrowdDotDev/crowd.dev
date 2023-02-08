import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import buildApiPayload from '@/shared/filter/helpers/build-api-payload'

export class EagleEyeService {
  static async query(filter, orderBy, limit, offset) {
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

  static async search() {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/eagleEyeContent/search`
    )

    return response.data
  }
}
