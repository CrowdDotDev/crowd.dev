import TaskRepository from '../../database/repositories/taskRepository'
import UserRepository from '../../database/repositories/userRepository'
import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
import Roles from '../../security/roles'
import TaskService from '../taskService'

const db = null

describe('TaskService tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll(async () => {
    // Closing the DB connection allows Jest to exit successfully.
    await SequelizeTestUtils.closeConnection(db)
  })

  describe('Assign to user by ID', () => {
    it('Should work when sending null or undefined', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const options2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        assignedTo: mockIRepositoryOptions.currentUser.id,
      })

      const task2 = await service.create({
        name: 'Task 2',
        assignedTo: options2.currentUser.id,
      })

      const updated = await service.assignTo(task.id, null)
      expect(updated.assignees).toStrictEqual([])

      const updated2 = await service.assignTo(task2.id, undefined)
      expect(updated2.assignees).toStrictEqual([])
    })

    it('Should work when sending changing assignee user with another user', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const user2 = await UserRepository.create(
        await SequelizeTestUtils.getRandomUser(),
        mockIRepositoryOptions,
      )

      // add user to tenant
      await mockIRepositoryOptions.database.tenantUser.create({
        roles: [Roles.values.admin],
        status: 'active',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        userId: user2.id,
      })

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        assignedTo: mockIRepositoryOptions.currentUser.id,
      })

      const updated = await service.assignTo(task.id, [user2.id])
      expect(updated.assignees.map((i) => i.id)).toStrictEqual([user2.id])
    })
  })

  describe('Assign to user by email', () => {
    it('Should work when sending null or undefined', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const user2 = await UserRepository.create(
        await SequelizeTestUtils.getRandomUser(),
        mockIRepositoryOptions,
      )

      // add user to tenant
      await mockIRepositoryOptions.database.tenantUser.create({
        roles: [Roles.values.admin],
        status: 'active',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        userId: user2.id,
      })

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        assignees: [mockIRepositoryOptions.currentUser.id],
      })

      const task2 = await service.create({
        name: 'Task 2',
        assignees: [user2.id],
      })

      const updated = await service.assignToByEmail(task.id, null)
      expect(updated.assignees).toStrictEqual([])

      const updated2 = await service.assignToByEmail(task2.id, undefined)
      expect(updated2.assignees).toStrictEqual([])
    })

    it('Should work when sending changing a user for another', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const user2 = await UserRepository.create(
        await SequelizeTestUtils.getRandomUser(),
        mockIRepositoryOptions,
      )

      // add user to tenant
      await mockIRepositoryOptions.database.tenantUser.create({
        roles: [Roles.values.admin],
        status: 'active',
        tenantId: mockIRepositoryOptions.currentTenant.id,
        userId: user2.id,
      })

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        assignedTo: mockIRepositoryOptions.currentUser.id,
      })

      const updated = await service.assignToByEmail(task.id, user2.email)
      expect(updated.assignees.map((i) => i.id)).toStrictEqual([user2.id])
    })
  })

  describe('Change status', () => {
    it('Should work when sending an empty array', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        status: 'in-progress',
      })

      const task2 = await service.create({
        name: 'Task 2',
        status: 'archived',
      })

      const updated = await service.updateStatus(task.id, null)
      expect(updated.status).toBeNull()

      const updated2 = await service.updateStatus(task2.id, undefined)
      expect(updated2.status).toBeNull()
    })

    it('Should work when sending a different status', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        status: 'in-progress',
      })

      const updated = await service.updateStatus(task.id, 'done')
      expect(updated.status).toBe('done')
    })
  })

  describe('findAndUpdateAll', () => {
    it('Should find all tasks with given filter, and update found tasks with given payload', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      let task1 = await service.create({
        name: 'Task 1',
        status: 'in-progress',
      })

      let task2 = await service.create({
        name: 'Task 2',
        status: 'in-progress',
      })

      let task3 = await service.create({
        name: 'Task 3',
        status: 'archived',
      })

      let task4 = await service.create({
        name: 'Task 4',
        status: 'in-progress',
      })

      // change all in-progress to done
      let updated = await service.findAndUpdateAll({
        filter: {
          status: 'in-progress',
        },
        update: {
          status: 'done',
        },
      })

      expect(updated.rowsUpdated).toStrictEqual(3)

      task1 = await service.findById(task1.id)
      task2 = await service.findById(task2.id)
      task3 = await service.findById(task3.id)
      task4 = await service.findById(task4.id)

      expect(task1.status).toStrictEqual('done')
      expect(task2.status).toStrictEqual('done')
      expect(task3.status).toStrictEqual('archived')
      expect(task4.status).toStrictEqual('done')

      // change all done to archived
      updated = await service.findAndUpdateAll({
        filter: {
          status: 'done',
        },
        update: {
          status: 'archived',
        },
      })

      task1 = await service.findById(task1.id)
      task2 = await service.findById(task2.id)
      task3 = await service.findById(task3.id)
      task4 = await service.findById(task4.id)

      expect(task1.status).toStrictEqual('archived')
      expect(task2.status).toStrictEqual('archived')
      expect(task3.status).toStrictEqual('archived')
      expect(task4.status).toStrictEqual('archived')

      // change all archived to in progress
      updated = await service.findAndUpdateAll({
        filter: {
          status: 'archived',
        },
        update: {
          status: 'in-progress',
        },
      })

      task1 = await service.findById(task1.id)
      task2 = await service.findById(task2.id)
      task3 = await service.findById(task3.id)
      task4 = await service.findById(task4.id)

      expect(task1.status).toStrictEqual('in-progress')
      expect(task2.status).toStrictEqual('in-progress')
      expect(task3.status).toStrictEqual('in-progress')
      expect(task4.status).toStrictEqual('in-progress')
    })
  })
  describe('findAndUpdateAll', () => {
    it('Should find all tasks with given filter, and delete found tasks', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      await service.create({
        name: 'Task 1',
        status: 'in-progress',
      })

      await service.create({
        name: 'Task 2',
        status: 'in-progress',
      })

      const task3 = await service.create({
        name: 'Task 3',
        status: 'archived',
      })

      await service.create({
        name: 'Task 4',
        status: 'in-progress',
      })

      // change all in-progress to done
      const deleted = await service.findAndDeleteAll({
        filter: {
          status: 'in-progress',
        },
      })

      expect(deleted.rowsDeleted).toStrictEqual(3)

      // get all tasks and check count
      const tasks = await TaskRepository.findAndCountAll({ filter: {} }, mockIRepositoryOptions)

      expect(tasks.count).toBe(1)
      expect(tasks.rows[0].id).toStrictEqual(task3.id)
    })
  })
})
