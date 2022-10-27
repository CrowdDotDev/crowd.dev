import SequelizeTestUtils from '../../database/utils/sequelizeTestUtils'
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
      expect(updated.assignedToId).toBeNull()

      const updated2 = await service.assignTo(task2.id, undefined)
      expect(updated2.assignedToId).toBeNull()
    })

    it('Should work when sending changing a user for another', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const options2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        assignedTo: mockIRepositoryOptions.currentUser.id,
      })

      const updated = await service.assignTo(task.id, options2.currentUser.id)
      expect(updated.assignedToId).toBe(options2.currentUser.id)
    })
  })

  describe('Assign to user by email', () => {
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

      const updated = await service.assignToByEmail(task.id, null)
      expect(updated.assignedToId).toBeNull()

      const updated2 = await service.assignToByEmail(task2.id, undefined)
      expect(updated2.assignedToId).toBeNull()
    })

    it('Should work when sending changing a user for another', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const options2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        assignedTo: mockIRepositoryOptions.currentUser.id,
      })

      const updated = await service.assignToByEmail(task.id, options2.currentUser.email)
      expect(updated.assignedToId).toBe(options2.currentUser.id)
    })
  })

  describe('Change stauts', () => {
    it('Should work when sending null or undefined', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const service = new TaskService(mockIRepositoryOptions)

      const task = await service.create({
        name: 'Task 1',
        status: 'in-progress',
      })

      const task2 = await service.create({
        name: 'Task 2',
        status: 'cancelled',
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
})
