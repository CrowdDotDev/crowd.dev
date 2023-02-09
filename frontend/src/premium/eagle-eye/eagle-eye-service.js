import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class EagleEyeService {
  static async query(filter, orderBy, limit, offset) {
    const body = {
      filter,
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

  static async createContent({ post }) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent`,
      post
    )

    return response.data
  }

  static async addAction({ postId, actionData }) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent/${postId}/action`,
      actionData
    )

    return response.data
  }

  static async deleteAction({ postId, actionId }) {
    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.delete(
      `/tenant/${tenantId}/eagleEyeContent/${postId}/action/${actionId}`
    )

    return response.data
  }
}
