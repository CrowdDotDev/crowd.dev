import { Error404 } from '@crowd/common'
import UserRepository from '../userRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Roles from '../../../security/roles'

const db = null

describe('UserRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('findAllUsersOfTenant method', () => {
    it('Should find all related users of a tenant successfully', async () => {
      // Getting options already creates one random user
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      let allUsersOfTenant = (
        await UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id)
      ).map((u) => SequelizeTestUtils.objectWithoutKey(u, 'tenants'))

      expect(allUsersOfTenant).toStrictEqual([
        mockIRepositoryOptions.currentUser.get({ plain: true }),
      ])

      // add more users to the test tenant
      const randomUser2 = await SequelizeTestUtils.getRandomUser()
      const user2 = await mockIRepositoryOptions.database.user.create(randomUser2)

      await mockIRepositoryOptions.database.tenantUser.create({
        roles: [Roles.values.admin],
        status: 'active',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        userId: user2.id,
      })

      allUsersOfTenant = (
        await UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id)
      ).map((u) => SequelizeTestUtils.objectWithoutKey(u, 'tenants'))

      expect(allUsersOfTenant).toStrictEqual([
        mockIRepositoryOptions.currentUser.get({ plain: true }),
        user2.get({ plain: true }),
      ])

      const randomUser3 = await SequelizeTestUtils.getRandomUser()
      const user3 = await mockIRepositoryOptions.database.user.create(randomUser3)

      await mockIRepositoryOptions.database.tenantUser.create({
        roles: [Roles.values.admin],
        status: 'active',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        userId: user3.id,
      })

      allUsersOfTenant = (
        await UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id)
      ).map((u) => SequelizeTestUtils.objectWithoutKey(u, 'tenants'))

      expect(allUsersOfTenant).toStrictEqual([
        mockIRepositoryOptions.currentUser.get({ plain: true }),
        user2.get({ plain: true }),
        user3.get({ plain: true }),
      ])

      // add  other users and tenants that are non related to previous couples
      await SequelizeTestUtils.getTestIRepositoryOptions(db)

      // users of the previous tenant should be the same
      allUsersOfTenant = (
        await UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id)
      ).map((u) => SequelizeTestUtils.objectWithoutKey(u, 'tenants'))

      expect(allUsersOfTenant).toStrictEqual([
        mockIRepositoryOptions.currentUser.get({ plain: true }),
        user2.get({ plain: true }),
        user3.get({ plain: true }),
      ])

      const tenantUsers = await mockIRepositoryOptions.database.tenantUser.findAll({
        tenantId: mockIRepositoryOptions.currentTenant.id,
      })

      // remove last user added to the tenant
      await tenantUsers[2].destroy({ force: true })

      allUsersOfTenant = (
        await UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id)
      ).map((u) => SequelizeTestUtils.objectWithoutKey(u, 'tenants'))

      expect(allUsersOfTenant).toStrictEqual([
        mockIRepositoryOptions.currentUser.get({ plain: true }),
        user2.get({ plain: true }),
      ])

      // remove first user added to the tenant
      await tenantUsers[0].destroy({ force: true })

      allUsersOfTenant = (
        await UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id)
      ).map((u) => SequelizeTestUtils.objectWithoutKey(u, 'tenants'))

      expect(allUsersOfTenant).toStrictEqual([user2.get({ plain: true })])

      // remove the last remaining user from the tenant
      await tenantUsers[1].destroy({ force: true })

      // function now should be throwing Error404
      await expect(() =>
        UserRepository.findAllUsersOfTenant(mockIRepositoryOptions.currentTenant.id),
      ).rejects.toThrowError(new Error404())
    })
  })
})
