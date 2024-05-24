import { generateUUIDv4 } from '@crowd/common'
import { IDbEventInsertData, IDbSessionInsertData, ISessionData } from '@/product/types'
import { IRepositoryOptions } from './IRepositoryOptions'

export default class ProductAnalyticsRepository {
  static async createSession(
    data: IDbSessionInsertData,
    options: IRepositoryOptions,
  ): Promise<ISessionData> {
    const record = await options.productDb.one(
      `insert into "sessions" ("id", "userId", "userEmail", "ipAddress", "country")
      values ($(id), $(userId), $(userEmail), $(ipAddress), $(country)) returning *`,
      {
        id: generateUUIDv4(),
        userId: data.userId,
        userEmail: data.userEmail,
        ipAddress: data.ipAddress,
        country: data.country,
      },
    )

    return record
  }

  static async updateSession(
    sessionId: string,
    data: Partial<ISessionData>,
    options: IRepositoryOptions,
  ): Promise<void> {
    const updateFields = Object.entries(data)
      .map(([key, value]) => `"${key}" = '${value}'`)
      .join(', ')

    await options.productDb.none(
      `update "sessions"
       set ${updateFields}
       where "id" = '${sessionId}'`,
    )
  }

  static async createEvent(data: IDbEventInsertData, options: IRepositoryOptions): Promise<void> {
    await options.productDb.none(
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
}
