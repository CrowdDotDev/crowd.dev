import io from 'socket.io-client'
import posthog from 'posthog-js'
import config from '@/config'
import { computed } from 'vue'
import { store } from '@/store'
import Message from '@/shared/message/message'

let socketIoClient

export const connectSocket = (token) => {
  if (socketIoClient && socketIoClient.connected) {
    socketIoClient.disconnect()
  }
  const currentTenant = computed(
    () => store.getters['auth/currentTenant']
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
    // TODO handle this data
  })

  socketIoClient.on('tenant-plan-upgraded', (data) => {
    console.log(
      'Tenant plan is upgraded. Force a hard refresh!',
      data
    )
    posthog.group('tenant', currentTenant.value.id)
    posthog.reloadFeatureFlags()
    store.dispatch('auth/doRefreshCurrentUser')
    Message.success('Successfully upgraded to Growth plan')
  })

  socketIoClient.on('bulk-enrichment', (data) => {
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    console.log('Bulk enrichment is completed', data)

    // posthog.group('tenant', currentTenant.value.id)
    // posthog.reloadFeatureFlags()
    store.dispatch('auth/doRefreshCurrentUser')
    if (!data.success) {
      Message.error(
        `Bulk enrichment failed. We managed to enrich ${data.enrichedMembers} members.`
      )
    } else {
      Message.success(
        `Bulk enrichment succeeded. We enriched ${data.enrichedMembers} members.`
      )
    }
  })
}

export const disconnectSocket = () => {
  if (socketIoClient) {
    socketIoClient.disconnect()
  }
}
