import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import buildApiFilter from '@/shared/filter/build-api-filter'

export class MemberService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${id}`,
      data
    )

    return response.data
  }

  static async updateBulk(data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.patch(
      `/tenant/${tenantId}/member`,
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
      `/tenant/${tenantId}/member`,
      {
        params
      }
    )

    return response.data
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/member`,
      data.data
    )

    return response.data
  }

  static async import(values, importHash) {
    const body = {
      data: values,
      importHash
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/import`,
      body
    )

    return response.data
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/${id}`
    )

    return response.data
  }

  static async list(
    filter,
    orderBy,
    limit,
    offset,
    build = true
  ) {
    const body = {
      filter: build ? buildApiFilter(filter) : filter,
      orderBy,
      limit,
      offset
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/query`,
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
      `/tenant/${tenantId}/member/autocomplete`,
      {
        params
      }
    )

    return response.data
  }

  static async merge(memberToKeep, memberToMerge) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberToKeep.id}/merge`,
      {
        memberToMerge: memberToMerge.id
      }
    )

    return response.data
  }

  static async addToNoMerge(memberA, memberB) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberA.id}/no-merge`,
      {
        memberToNotMerge: memberB.id
      }
    )

    return response.data
  }

  static async fetchMergeSuggestions() {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/membersToMerge`
    )

    return response.data
  }

  static async fetchCustomAttributes() {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes`
    )

    return response.data
  }

  static async createCustomAttributes(data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/settings/members/attributes`,
      data
    )

    return response.data
  }

  static async destroyCustomAttribute(id) {
    const params = {
      ids: [id]
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        params
      }
    )

    return response.data
  }

  static async updateCustomAttribute(id, data) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/settings/members/attributes/${id}`,
      data
    )

    return response.data
  }
}
