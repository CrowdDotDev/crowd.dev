import { Server as SocketServer } from 'socket.io'
import { Server } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import { IRedisPubSubPair } from '../../utils/redis'
import { createServiceChildLogger, Logger } from '../../utils/logging'
import WebSocketNamespace from './namespace'
import { IAuthenticatedSocket } from './types'

export default class WebSockets {
  private readonly log: Logger

  private readonly socketIo: SocketServer

  public constructor(server: Server, redisPubSubPair: IRedisPubSubPair) {
    this.log = createServiceChildLogger('websockets')
    this.socketIo = new SocketServer(server)

    const adapter = createAdapter(redisPubSubPair.pubClient, redisPubSubPair.subClient)
    this.socketIo.adapter(adapter)

    this.log.info('Socket.IO server initialized!')
  }

  public authenticatedNamespace(name: string): WebSocketNamespace<IAuthenticatedSocket> {
    return new WebSocketNamespace<IAuthenticatedSocket>(this.socketIo, name, true)
  }

  public static async initialize(
    server: Server,
    redisPubSubPair: IRedisPubSubPair,
  ): Promise<WebSocketNamespace<IAuthenticatedSocket>> {
    const websockets = new WebSockets(server, redisPubSubPair)
    return websockets.authenticatedNamespace('/user')
  }
}
