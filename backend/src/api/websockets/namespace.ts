import { Namespace, Server } from 'socket.io'
import { NextFunction } from 'express'
import { IAuthenticatedSocket, ISocket, ISocketHandler } from './index'
import { createServiceChildLogger, Logger } from '../../utils/logging'
import AuthService from '../../services/auth/authService'
import { databaseInit } from '../../database/databaseConnection'

const logger = createServiceChildLogger('websockets/namespaces')

export default class WebSocketNamespace<TSocket extends ISocket = ISocket> {
  private readonly log: Logger

  public readonly socketIoNamespace: Namespace

  public constructor(
    socketIoServer: Server,
    public readonly namespace: string,
    public readonly authenticated: boolean,
  ) {
    this.log = logger.child({ namespace }, true)

    this.socketIoNamespace = socketIoServer.of(namespace)

    // database middleware
    this.socketIoNamespace.use(async (socket: any, next: NextFunction) => {
      try {
        socket.database = await databaseInit()
        next()
      } catch (err) {
        this.log.error(err, 'Database connection error!')
        next(err)
      }
    })

    if (authenticated) {
      // auth middleware
      this.socketIoNamespace.use(async (socket: any, next: NextFunction) => {
        try {
          if (socket.handshake.query && socket.handshake.query.token) {
            socket.user = await AuthService.findByToken(socket.handshake.query.token, socket)
            next()
          } else {
            next(new Error('Authentication error'))
          }
        } catch (err) {
          this.log.error(err, 'WebSockets authentication error!')
          next(err)
        }
      })
    }

    // handle connect
    this.socketIoNamespace.on('connection', (socket: ISocket) => {
      if (authenticated) {
        this.log.debug(
          { userId: (socket as IAuthenticatedSocket).user.id },
          'Authenticated user connected!',
        )
        // add to user room if we need to send a notification to this user only
        socket.join(`user-${(socket as IAuthenticatedSocket).user.id}`)
      } else {
        this.log.debug('User connected!')
      }

      socket.emit('connected')

      if (authenticated) {
        socket.on('tenant-subscribe', (tenantId: string) => {
          const user = (socket as IAuthenticatedSocket).user
          if (user.tenants.find((t) => t.tenantId === tenantId) !== undefined) {
            socket.join(`tenant-${tenantId}`)
            socket.emit('success')
          } else {
            socket.emit('not-allowed')
          }
        })

        socket.on('tenant-unsubscribe', (tenantId: string) => {
          socket.leave(`tenant-${tenantId}`)
          socket.emit('success')
        })
      }

      // handle disconnect
      socket.on('disconnect', () => {
        if (authenticated) {
          this.log.debug(
            { userId: (socket as IAuthenticatedSocket).user.id },
            'Authenticated user disconnected!',
          )
        } else {
          this.log.debug('User disconnected!')
        }

        ;(socket as any).leaveAll()
      })
    })
  }

  public on(event: string, handler: ISocketHandler<TSocket>) {
    this.socketIoNamespace.on(event, handler)
  }

  public emit(event: string, data: string) {
    this.socketIoNamespace.emit(event, data)
  }

  public emitToRoom(room: string, event: string, data: string) {
    this.socketIoNamespace.to(room).emit(event, data)
  }

  public emitToUserRoom(userId: string, event: string, data: string) {
    this.emitToRoom(`user-${userId}`, event, data)
  }
}
