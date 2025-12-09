import type { QueryFunction } from '@tanstack/vue-query'
import { type ComputedRef, computed } from 'vue'
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import { TanstackKey } from '@/shared/types/tanstack'
import authAxios from '@/shared/axios/auth-axios'
import { GlobalIntegrationStatusCount, IntegrationStatusResponse } from '../types/overview.types'

export interface GlobalIntegrationStatusCountQueryParams {
  platform: string | undefined
}

export interface GlobalIntegrationIntegrationsQueryParams {
  platform: string | undefined
  status: string[]
  query: string
  limit: number
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

  fetchGlobalIntegrations(params: ComputedRef<GlobalIntegrationIntegrationsQueryParams>) {
    const queryKey = computed(() => [
      TanstackKey.GLOBAL_INTEGRATIONS,
      params.value.platform,
      params.value.status,
      params.value.query,
      params.value.limit,
    ])
    const queryFn = computed<QueryFunction<IntegrationStatusResponse>>(() =>
      this.fetchGlobalIntegrationsQueryFn(() => ({
        ...params.value,
      })),
    )

    return useInfiniteQuery<
      IntegrationStatusResponse,
      Error,
      IntegrationStatusResponse,
      readonly unknown[],
      number
    >({
      queryKey,
      //@ts-expect-error - TanStack Query type inference issue with Vue
      queryFn,
      getNextPageParam: this.getNextPageIntegrationsParam,
      initialPageParam: 0,
    })
  }

  fetchGlobalIntegrationsQueryFn(
    query: () => Record<string, string | number | boolean | undefined | string[] | null>,
  ): QueryFunction<IntegrationStatusResponse> {
    return ({ pageParam = 0 }) =>
      authAxios
        .get('/integration/global', {
          params: { offset: pageParam, ...query() },
        })
        .then((res) => res.data)
  }

  getNextPageIntegrationsParam(lastPage: IntegrationStatusResponse): number | undefined {
    const nextPage = lastPage.offset + lastPage.limit
    const totalRows = lastPage.count
    return nextPage < totalRows ? nextPage : undefined
  }
}

export const OVERVIEW_API_SERVICE = new OverviewApiService()
