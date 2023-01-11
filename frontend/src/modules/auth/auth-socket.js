import io from 'socket.io-client'
import config from '@/config'

let socketIoClient

export const connectSocket = (token) => {
  if (socketIoClient && socketIoClient.connected) {
    socketIoClient.disconnect()
  }

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
}

export const disconnectSocket = () => {
  if (socketIoClient) {
    socketIoClient.disconnect()
  }
}
