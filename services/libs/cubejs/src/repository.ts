import * as metrics from './metrics/index'

export class CubeJsRepository {
  static getActiveMembers = metrics.activeMembers

  static getActiveMembersTimeseries = metrics.activeMembersTimeseries

  static getNewActivities = metrics.newActivities

  static getNewActivitiesTimeseries = metrics.newActivitiesTimeseries

  static getNewConversations = metrics.newConversations

  static getNewMembers = metrics.newMembers

  static getNewMemberTimeseries = metrics.newMembersTimeseries

  static getNewOrganizations = metrics.newOrganizations

  static getNewOrganizationsTimeseries = metrics.newOrganizationsTimeseries

  static getActiveOrganizations = metrics.activeOrganizations

  static getActiveOrganizationsTimeseries = metrics.activeOrganizationsTimeseries
}
