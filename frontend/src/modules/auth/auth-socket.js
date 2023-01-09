import io from 'socket.io-client'
import config from '@/config'

let socketIoClient

export const connectSocket = (token) => {
  if (socketIoClient && socketIoClient.connected) {
    socketIoClient.disconnect()
  }

  socketIoClient = io(`${config.websocketsUrl}/user`, {
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

  socketIoClient.on(
    'integration-onboarding-done',
    (data) => {
      console.log('Integration onboarding done', data)
    }
  )
}

export const disconnectSocket = () => {
  if (socketIoClient) {
    socketIoClient.disconnect()
  }
}

export const subscribeToTenantMessages = (tenantId) => {
  if (socketIoClient) {
    socketIoClient.emit('tenant-subscribe', tenantId)
  }
}

export const unsubscribeFromTenantMessages = (tenantId) => {
  if (socketIoClient) {
    socketIoClient.emit('tenant-unsubscribe', tenantId)
  }
}
