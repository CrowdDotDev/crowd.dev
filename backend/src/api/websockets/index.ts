import { Server as SocketServer, Socket } from 'socket.io'
import { Server } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import { NextFunction } from 'express'
import { IRedisPubSubPair } from '../../utils/redis'
import { createServiceChildLogger, Logger } from '../../utils/logging'

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
}

export interface ISocket extends Socket {
  database: any
}

export interface IAuthenticatedSocket extends ISocket {
  user: any
}

export interface ISocketHandler<TSocket extends ISocket = ISocket> {
  (socket: TSocket, next: NextFunction): void
}
