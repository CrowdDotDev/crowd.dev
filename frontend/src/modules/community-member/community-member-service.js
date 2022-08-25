import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class CommunityMemberService {
  static async update(id, data) {
    const body = {
      id,
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/community-member/${id}`,
      body
    )

    return response.data
  }

  static async updateBulk(data) {
    const body = {
      data
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.patch(
      `/tenant/${tenantId}/community-member`,
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
      `/tenant/${tenantId}/community-member`,
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
      `/tenant/${tenantId}/community-member`,
      body
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
      `/tenant/${tenantId}/community-member/import`,
      body
    )

    return response.data
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/community-member/${id}`
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
      `/tenant/${tenantId}/community-member`,
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
      `/tenant/${tenantId}/community-member/autocomplete`,
      {
        params
      }
    )

    return response.data
  }

  static async merge(memberToKeep, memberToMerge) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/community-member/${memberToKeep.id}/merge`,
      {
        data: {
          memberToMerge: memberToMerge.id
        }
      }
    )

    return response.data
  }

  static async addToNoMerge(memberA, memberB) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.put(
      `/tenant/${tenantId}/community-member/${memberA.id}/no-merge`,
      {
        data: {
          memberToNotMerge: memberB.id
        }
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
}
