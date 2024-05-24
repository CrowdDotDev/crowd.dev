export interface ISessionData {
  id: string
  userId: string
  userEmail: string
  startTime: string
  endTime: string
  ipAddress: string
  country: string
}

export type IDbSessionInsertData = Omit<ISessionData, 'endTime'>

export interface IEventData {
  id: string
  sessionId: string
  type: string
  key: string
  properties?: object
  createdAt: string
  userId: string
  userEmail: string
}

export type IDbEventInsertData = Omit<IEventData, 'id' | 'createdAt'>
