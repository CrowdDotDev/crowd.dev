import type { QueryFunction } from '@tanstack/vue-query'
import { type ComputedRef, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { TanstackKey } from '@/shared/types/tanstack'
import authAxios from '@/shared/axios/auth-axios'
import { GlobalIntegrationStatusCount } from '../types/overview.types'

export interface GlobalIntegrationStatusCountQueryParams {
  platform: string | undefined
}

class OverviewApiService {
  fetchGlobalIntegrationStatusCount(params: ComputedRef<GlobalIntegrationStatusCountQueryParams>) {
    const queryKey = computed(() => [
      TanstackKey.GLOBAL_INTEGRATION_STATUS_COUNT,
      params.value.platform,
    ])
    const queryFn = computed<QueryFunction<GlobalIntegrationStatusCount[]>>(() =>
      this.fetchGlobalIntegrationStatusCountQueryFn(() => ({
        platform: params.value.platform,
      })),
    )

    return useQuery<GlobalIntegrationStatusCount[]>({
      queryKey,
      queryFn,
    })
  }

  fetchGlobalIntegrationStatusCountQueryFn(
    query: () => Record<string, string | number | boolean | undefined | string[] | null>,
  ): QueryFunction<GlobalIntegrationStatusCount[]> {
    return () =>
      authAxios
        .get('/integration/global/status', {
          params: query(),
        })
        .then((res) => res.data)
  }
}

export const OVERVIEW_API_SERVICE = new OverviewApiService()
