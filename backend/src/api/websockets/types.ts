import { NextFunction } from 'express'
import { Socket } from 'socket.io'

export interface ISocket extends Socket {
  database: any
}

export interface IAuthenticatedSocket extends ISocket {
  user: any
}

export interface ISocketHandler<TSocket extends ISocket = ISocket> {
  (socket: TSocket, next: NextFunction): void
}
