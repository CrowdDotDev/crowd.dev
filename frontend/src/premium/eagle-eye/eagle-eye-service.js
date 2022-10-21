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
      filter: _transformFilter(filter),
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
    const data = {
      keywords,
      nDays
    }

    const tenantId = AuthCurrentTenant.get()

    await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent`,
      { data }
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

const _transformFilter = (filter) => {
  // TODO: this needs to be updated once the API of eagle also gets update to new query/filter format

  return Object.keys(filter.attributes).reduce(
    (acc, item) => {
      const value = filter.attributes[item].value
      acc[item] = Array.isArray(value)
        ? value.join(',')
        : value
      return acc
    },
    {}
  )
}
