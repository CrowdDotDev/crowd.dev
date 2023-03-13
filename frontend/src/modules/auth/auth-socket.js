import io from 'socket.io-client'
import config from '@/config'
import { computed } from 'vue'
import { store } from '@/store'
import Message from '@/shared/message/message'
import {
  showEnrichmentSuccessMessage,
  getEnrichmentMax
} from '@/modules/member/member-enrichment'
import pluralize from 'pluralize'

let socketIoClient

export const connectSocket = (token) => {
  if (socketIoClient && socketIoClient.connected) {
    socketIoClient.disconnect()
  }
  const currentTenant = computed(
    () => store.getters['auth/currentTenant']
  )
  const currentUser = computed(
    () => store.getters['auth/currentUser']
  )

  const path =
    config.env === 'production' || config.env === 'staging'
      ? '/api/socket.io'
      : '/socket.io'

  socketIoClient = io(`${config.websocketsUrl}/user`, {
    path,
    query: {
      token
    },
    transports: ['websocket'],
    forceNew: true
  })

  socketIoClient.on('connect', () => {
    console.log('Socket connected')
  })

  socketIoClient.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  socketIoClient.on('integration-completed', (data) => {
    console.log('Integration onboarding done', data)
    store.dispatch(
      'integration/doFind',
      JSON.parse(data).integrationId
    )
  })

  socketIoClient.on(
    'tenant-plan-upgraded',
    async (data) => {
      console.log(
        'Tenant plan is upgraded. Force a hard refresh!',
        data
      )
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      await store.dispatch('auth/doRefreshCurrentUser')

      Message.success(
        `Successfully upgraded to ${data.plan} plan`
      )
    }
  )

  socketIoClient.on('bulk-enrichment', async (data) => {
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    await store.dispatch('auth/doRefreshCurrentUser')

    const updatedTenant = currentUser.value.tenants.find(
      (tenant) => tenant.tenantId === data.tenantId
    )

    if (!data.success) {
      Message.closeAll()
      Message.error(
        `Failed to enrich ${pluralize(
          'member',
          data.failedEnrichedMembers,
          true
        )}.`
      )
    } else {
      const planEnrichmentCountMax = getEnrichmentMax(
        updatedTenant.tenant.plan
      )

      // Show enrichment success message
      showEnrichmentSuccessMessage({
        enrichedMembers: data.enrichedMembers,
        memberEnrichmentCount:
          updatedTenant.tenant.memberEnrichmentCount,
        planEnrichmentCountMax,
        plan: updatedTenant.tenant.plan,
        isBulk: true
      })

      // Update members list if tenant hasn't changed
      if (currentTenant.value.id === data.tenantId) {
        // Refresh list page
        await store.dispatch('member/doFetch', {
          keepPagination: true
        })
      }
    }
  })
}

export const disconnectSocket = () => {
  if (socketIoClient) {
    socketIoClient.disconnect()
  }
}
