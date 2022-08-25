import authAxios from '@/shared/axios/auth-axios'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'

export class AuditLogService {
  static async fetch(filter, orderBy, limit, offset) {
    const query = {
      filter,
      orderBy,
      limit,
      offset
    }

    const tenantId = AuthCurrentTenant.get()

    const response = await authAxios.get(
      `/tenant/${tenantId}/audit-log`,
      {
        params: query
      }
    )

    return response.data
  }
}
