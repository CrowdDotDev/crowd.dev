export interface ISessionData {
  id: string
  userId: string
  userEmail: string
  startTime: string
  endTime: string
  ipAddress: string
  country: string
}

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
