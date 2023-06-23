import SequelizeRepository from './sequelizeRepository'

export default class UsersAuthenticationRepository {
  /**
   * Finds the user based on auth0 sub
   * @param authMethod
   * @returns user authentication object
   */
  static async findUserByAuthMethod(authMethod: string) {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    return await options.database.usersAuthentication.findOne({
      where: {
        authMethod,
      }
    }, {
      include: ['user'],
    });
  }
}
