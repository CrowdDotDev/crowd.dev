import { generateUUIDv4 } from '@crowd/common'
import { IEventData, ISessionData } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

type IDbSessionInsertData = Omit<ISessionData, 'endTime'>
type IDbEventInsertData = Omit<IEventData, 'id' | 'createdAt'>

export async function createSession(
  qx: QueryExecutor,
  data: IDbSessionInsertData,
): Promise<ISessionData> {
  const record = await qx.result(
    `insert into "sessions" ("id", "userId", "userEmail", "ipAddress", "country")
        values ($(id), $(userId), $(userEmail), $(ipAddress), $(country)) returning *`,
    {
      id: generateUUIDv4(),
      userId: data.userId,
      userEmail: data.userEmail,
      ipAddress: data.ipAddress || null,
      country: data.country || null,
    },
  )

  return record.rows[0]
}

export async function updateSession(
  qx: QueryExecutor,
  id: string,
  data: Partial<ISessionData>,
): Promise<void> {
  const updateFields = Object.entries(data)
    .map(([key, value]) => `"${key}" = '${value}'`)
    .join(', ')

  await qx.result(
    `update "sessions"
            set ${updateFields}
            where "id" = '${id}'`,
  )
}

export async function createEvent(qx: QueryExecutor, data: IDbEventInsertData): Promise<void> {
  await qx.result(
    `insert into "events" ("id", "sessionId", "type", "key", "properties", "userId", "userEmail")
            values ($(id), $(sessionId), $(type), $(key), $(properties), $(userId), $(userEmail))`,
    {
      id: generateUUIDv4(),
      sessionId: data.sessionId,
      type: data.type,
      key: data.key,
      properties: data.properties || {},
      userId: data.userId,
      userEmail: data.userEmail,
    },
  )
}
