import * as metrics from './metrics/index'

class CubeJsRepository {
  static getActiveMembers = metrics.activeMembers

  static getNewActivities = metrics.newActivities

  static getNewConversations = metrics.newConversations

  static getNewMembers = metrics.newMembers

  static getNewOrganizations = metrics.newOrganizations

  static getActiveOrganizations = metrics.activeOrganizations
}

export default CubeJsRepository
