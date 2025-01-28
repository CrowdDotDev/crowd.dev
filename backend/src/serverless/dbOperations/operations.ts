/**
 * Class to represent the database write operations allowed from Serverless
 */
export default class Operations {
  static UPDATE_MEMBERS: string = 'update_members'

  static UPSERT_MEMBERS: string = 'upsert_members'

  static UPSERT_ACTIVITIES_WITH_MEMBERS: string = 'upsert_activities_with_members'

  static UPDATE_INTEGRATIONS: string = 'update_integrations'
}
