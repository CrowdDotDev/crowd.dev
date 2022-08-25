import * as metrics from './metrics/index'

class CubeJsRepository {
  static getActiveMembers = metrics.activeMembers

  static getNewActivities = metrics.newActivities

  static getNewConversations = metrics.newConversations

  static getNewMembers = metrics.newMembers
}

export default CubeJsRepository
