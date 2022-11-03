import moment from 'moment'
import TaskRepository from '../taskRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import MemberRepository from '../memberRepository'
import ActivityRepository from '../activityRepository'
import { PlatformType } from '../../../types/integrationEnums'

const db = null

const toCreate = {
  name: 'name',
  body: 'body',
  status: 'done',
  dueDate: new Date(),
}

const sampleMembers = [
  {
    username: { [PlatformType.GITHUB]: 'harry_potter' },
    displayName: 'Harry Potter',
    joinedAt: new Date(),
  },
  {
    username: { [PlatformType.GITHUB]: 'hermione' },
    displayName: 'Hermione Granger',
    joinedAt: new Date(),
  },
  {
    username: { [PlatformType.GITHUB]: 'ron_weasley' },
    displayName: 'Ron Weasley',
    joinedAt: new Date(),
  },
]

const sampleActivities = [
  {
    type: 'type',
    timestamp: new Date(),
    platform: 'daily_prophet',
    sourceId: 'sourceId1',
  },
  {
    type: 'type',
    timestamp: new Date(),
    platform: 'daily_prophet',
    sourceId: 'sourceId2',
  },
  {
    type: 'type',
    timestamp: new Date(),
    platform: 'daily_prophet',
    sourceId: 'sourceId3',
  },
]

async function getToCreate(task, options, from = { fromMembers: [], fromActivities: [] }) {
  const { fromMembers, fromActivities } = from
  task.members = []
  task.activities = []
  for (const sampleMember of fromMembers) {
    task.members.push((await MemberRepository.create(sampleMember, options)).id)
  }
  for (const sampleActivity of fromActivities) {
    const memberId = (await MemberRepository.create(sampleMembers[0], options)).id
    sampleActivity.member = memberId
    task.activities.push((await ActivityRepository.create(sampleActivity, options)).id)
  }
  task.assignedTo = options ? options.currentUser.id : null
  return task
}

describe('TaskRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create the given task succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions)
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      createdTask.createdAt = createdTask.createdAt.toISOString().split('T')[0]
      createdTask.updatedAt = createdTask.updatedAt.toISOString().split('T')[0]
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const expectedTaskCreated = {
        id: createdTask.id,
        ...toCreate1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(createdTask).toStrictEqual(expectedTaskCreated)
    })

    it('Should create a task with members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: sampleMembers,
        fromActivities: [],
      })
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      createdTask.createdAt = createdTask.createdAt.toISOString().split('T')[0]
      createdTask.updatedAt = createdTask.updatedAt.toISOString().split('T')[0]

      createdTask.members = createdTask.members.map((member) => member.id)
      createdTask.activities = createdTask.activities.map((activity) => activity.id)
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const expectedTaskCreated = {
        id: createdTask.id,
        ...toCreate1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(createdTask).toStrictEqual(expectedTaskCreated)
      expect(createdTask.members.length).toBe(sampleMembers.length)

      // Make sure the task exists in the member
      for (const memberId of createdTask.members) {
        const found = await MemberRepository.findById(memberId, mockIRepositoryOptions)
        expect(found.tasks[0].id).toBe(createdTask.id)
      }
    })

    it('Should create a task with activities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [],
        fromActivities: sampleActivities,
      })
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      createdTask.createdAt = createdTask.createdAt.toISOString().split('T')[0]
      createdTask.updatedAt = createdTask.updatedAt.toISOString().split('T')[0]

      createdTask.members = createdTask.members.map((member) => member.id)
      createdTask.activities = createdTask.activities.map((activity) => activity.id)
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const expectedTaskCreated = {
        id: createdTask.id,
        ...toCreate1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(createdTask).toStrictEqual(expectedTaskCreated)
      expect(createdTask.activities.length).toBe(sampleActivities.length)

      // Make sure the task exists in the member
      for (const activityId of createdTask.activities) {
        const found = await ActivityRepository.findById(activityId, mockIRepositoryOptions)
        expect(found.tasks[0].id).toBe(createdTask.id)
      }
    })

    it('Should create a task with members and activities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: sampleMembers,
        fromActivities: sampleActivities,
      })
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      createdTask.createdAt = createdTask.createdAt.toISOString().split('T')[0]
      createdTask.updatedAt = createdTask.updatedAt.toISOString().split('T')[0]

      createdTask.members = createdTask.members.map((member) => member.id)
      createdTask.activities = createdTask.activities.map((activity) => activity.id)
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const expectedTaskCreated = {
        id: createdTask.id,
        ...toCreate1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(createdTask).toStrictEqual(expectedTaskCreated)
      expect(createdTask.activities.length).toBe(sampleActivities.length)
      expect(createdTask.members.length).toBe(sampleMembers.length)
    })

    it('Should create a task with a different assignee as the user creating it', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const mockAssignee = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockAssignee, {
        fromMembers: [],
        fromActivities: [],
      })
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      createdTask.createdAt = createdTask.createdAt.toISOString().split('T')[0]
      createdTask.updatedAt = createdTask.updatedAt.toISOString().split('T')[0]

      createdTask.members = createdTask.members.map((member) => member.id)
      createdTask.activities = createdTask.activities.map((activity) => activity.id)
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const expectedTaskCreated = {
        id: createdTask.id,
        ...toCreate1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(createdTask).toStrictEqual(expectedTaskCreated)
      expect(createdTask.assignedToId).toBe(mockAssignee.currentUser.id)
      expect(createdTask.assignedToId).not.toBe(mockIRepositoryOptions.currentUser.id)
    })

    it('Should throw an error when status is something not allowed', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const task2add = {
        name: 'Task 2',
        status: 'something',
      }

      await expect(() => TaskRepository.create(task2add, mockIRepositoryOptions)).rejects.toThrow()
    })

    it('Should throw sequelize not null error -- name field is required', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const task2add = {}

      await expect(() => TaskRepository.create(task2add, mockIRepositoryOptions)).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created task by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [],
        fromActivities: [],
      })
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      createdTask.createdAt = createdTask.createdAt.toISOString().split('T')[0]
      createdTask.updatedAt = createdTask.updatedAt.toISOString().split('T')[0]

      createdTask.members = createdTask.members.map((member) => member.id)
      createdTask.activities = createdTask.activities.map((activity) => activity.id)
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const expectedTaskFound = {
        id: createdTask.id,
        ...toCreate1,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      const taskById = await TaskRepository.findById(createdTask.id, mockIRepositoryOptions)

      taskById.createdAt = taskById.createdAt.toISOString().split('T')[0]
      taskById.updatedAt = taskById.updatedAt.toISOString().split('T')[0]

      expect(taskById).toStrictEqual(expectedTaskFound)
    })

    it('Should throw 404 error when no task found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        TaskRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created task entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const task1 = { name: 'test1' }
      const task2 = { name: 'test2' }

      const task1Created = await TaskRepository.create(task1, mockIRepositoryOptions)
      const task2Created = await TaskRepository.create(task2, mockIRepositoryOptions)

      const filterIdsReturned = await TaskRepository.filterIdsInTenant(
        [task1Created.id, task2Created.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([task1Created.id, task2Created.id])
    })

    it('Should only return the ids of previously created tasks and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const task = { name: 'test1' }

      const taskCreated = await TaskRepository.create(task, mockIRepositoryOptions)

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await TaskRepository.filterIdsInTenant(
        [taskCreated.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([taskCreated.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const task = { name: 'test' }

      const taskCreated = await TaskRepository.create(task, mockIRepositoryOptions)

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await TaskRepository.filterIdsInTenant(
        [taskCreated.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('findAndCountAll method', () => {
    it('Should find and count all tasks', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [],
        fromActivities: [],
      })
      const toCreate2 = await getToCreate(
        {
          name: 'Task 2',
          status: 'done',
        },
        mockIRepositoryOptions,
      )
      const createdTask = await TaskRepository.create(toCreate1, mockIRepositoryOptions)
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })
      const createdTask2 = await TaskRepository.create(toCreate2, mockIRepositoryOptions)

      const found = await TaskRepository.findAndCountAll({ filter: {} }, mockIRepositoryOptions)

      found.rows[1].createdAt = createdTask.createdAt.toISOString().split('T')[0]
      found.rows[1].updatedAt = createdTask.updatedAt.toISOString().split('T')[0]

      found.rows[1].members = createdTask.members.map((member) => member.id)
      found.rows[1].activities = createdTask.activities.map((activity) => activity.id)
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      found.rows[0].createdAt = createdTask2.createdAt.toISOString().split('T')[0]
      found.rows[0].updatedAt = createdTask2.updatedAt.toISOString().split('T')[0]

      found.rows[0].members = createdTask2.members.map((member) => member.id)
      found.rows[0].activities = createdTask2.activities.map((activity) => activity.id)
      toCreate2.assignedToId = toCreate2.assignedTo
      delete toCreate2.assignedTo

      expect(found).toStrictEqual({
        rows: [
          {
            id: createdTask2.id,
            ...toCreate2,
            body: null,
            dueDate: null,
            importHash: null,
            createdAt: SequelizeTestUtils.getNowWithoutTime(),
            updatedAt: SequelizeTestUtils.getNowWithoutTime(),
            deletedAt: null,
            tenantId: mockIRepositoryOptions.currentTenant.id,
            createdById: mockIRepositoryOptions.currentUser.id,
            updatedById: mockIRepositoryOptions.currentUser.id,
          },
          {
            id: createdTask.id,
            ...toCreate1,
            importHash: null,
            createdAt: SequelizeTestUtils.getNowWithoutTime(),
            updatedAt: SequelizeTestUtils.getNowWithoutTime(),
            deletedAt: null,
            tenantId: mockIRepositoryOptions.currentTenant.id,
            createdById: mockIRepositoryOptions.currentUser.id,
            updatedById: mockIRepositoryOptions.currentUser.id,
          },
        ],
        count: 2,
        limit: 10,
        offset: 0,
      })
    })

    describe('filter', () => {
      it('by name', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [],
          fromActivities: [],
        })
        const toCreate2 = await getToCreate(
          {
            name: 'Task',
            status: 'done',
          },
          mockIRepositoryOptions,
        )
        await TaskRepository.create(toCreate1, mockIRepositoryOptions)
        await TaskRepository.create(toCreate2, mockIRepositoryOptions)

        const found = await TaskRepository.findAndCountAll(
          { filter: { name: 'Task' } },
          mockIRepositoryOptions,
        )
        expect(found.count).toBe(1)
        expect(found.rows[0].name).toBe('Task')
      })

      it('by status', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [],
          fromActivities: [],
        })
        const toCreate2 = await getToCreate(
          {
            name: 'Task',
            status: 'in-progress',
          },
          mockIRepositoryOptions,
        )
        await TaskRepository.create(toCreate1, mockIRepositoryOptions)
        await TaskRepository.create(toCreate2, mockIRepositoryOptions)

        const found = await TaskRepository.findAndCountAll(
          { filter: { status: 'done' } },
          mockIRepositoryOptions,
        )
        expect(found.count).toBe(1)
        expect(found.rows[0].status).toBe('done')
      })

      it('by assignedTo', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        const options2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [],
          fromActivities: [],
        })
        const toCreate2 = await getToCreate(
          {
            name: 'Task',
            status: 'in-progress',
          },
          options2,
        )
        await TaskRepository.create(toCreate1, mockIRepositoryOptions)
        await TaskRepository.create(toCreate2, mockIRepositoryOptions)

        const toFilter = options2.currentUser.id.toString()

        const found = await TaskRepository.findAndCountAll(
          { filter: { assignedTo: toFilter } },
          mockIRepositoryOptions,
        )
        expect(found.count).toBe(1)
        expect(found.rows[0].assignedToId).toBe(options2.currentUser.id)
      })

      it('by dueDate', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
        const options2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [],
          fromActivities: [],
        })
        const toCreate2 = await getToCreate(
          {
            name: 'Task',
            status: 'in-progress',
            dueDate: moment().add(1, 'day').toDate(),
          },
          options2,
        )
        await TaskRepository.create(toCreate1, mockIRepositoryOptions)
        await TaskRepository.create(toCreate2, mockIRepositoryOptions)

        const found = await TaskRepository.findAndCountAll(
          {
            filter: {
              dueDateRange: [moment().startOf('day').toDate(), moment().endOf('day').toDate()],
            },
          },
          mockIRepositoryOptions,
        )
        expect(found.count).toBe(1)
        expect(found.rows[0].name).toBe(toCreate1.name)
      })

      it('by members', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [sampleMembers[0]],
          fromActivities: [],
        })
        const toCreate2 = await getToCreate(
          {
            name: 'Task',
            status: 'in-progress',
            dueDate: moment().add(1, 'day').toDate(),
          },
          mockIRepositoryOptions,
          {
            fromMembers: [sampleMembers[1], sampleMembers[2]],
            fromActivities: [],
          },
        )
        await TaskRepository.create(toCreate1, mockIRepositoryOptions)
        await TaskRepository.create(toCreate2, mockIRepositoryOptions)

        await SequelizeTestUtils.refreshMaterializedViews(db)

        const member = (
          await MemberRepository.findAndCountAll(
            {
              filter: {},
            },
            mockIRepositoryOptions,
          )
        ).rows[0]

        const toFilter = [member.id.toString()]

        const found = await TaskRepository.findAndCountAll(
          {
            filter: {
              members: toFilter,
            },
          },
          mockIRepositoryOptions,
        )
        expect(found.count).toBe(1)

        const members = (
          await MemberRepository.findAndCountAll(
            {
              filter: {},
            },
            mockIRepositoryOptions,
          )
        ).rows

        const m0Id = members.filter((m) => m.displayName === sampleMembers[0].displayName)[0].id

        const m1Id = members.filter((m) => m.displayName === sampleMembers[1].displayName)[0].id
        const found2 = await TaskRepository.findAndCountAll(
          {
            filter: {
              members: [m0Id, m1Id],
            },
          },
          mockIRepositoryOptions,
        )
        expect(found2.count).toBe(2)
      })

      it('by activity', async () => {
        const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

        const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [],
          fromActivities: [sampleActivities[0]],
        })
        const toCreate2 = await getToCreate(
          {
            name: 'Task',
            status: 'in-progress',
            dueDate: moment().add(1, 'day').toDate(),
          },
          mockIRepositoryOptions,
          {
            fromMembers: [],
            fromActivities: [sampleActivities[1], sampleActivities[2]],
          },
        )
        await TaskRepository.create(toCreate1, mockIRepositoryOptions)
        await TaskRepository.create(toCreate2, mockIRepositoryOptions)

        const act = (
          await ActivityRepository.findAndCountAll(
            {
              filter: {},
            },
            mockIRepositoryOptions,
          )
        ).rows[0]

        const toFilter = [act.id.toString()]

        const found = await TaskRepository.findAndCountAll(
          {
            filter: {
              activities: toFilter,
            },
          },
          mockIRepositoryOptions,
        )
        expect(found.count).toBe(1)

        const activities = (
          await ActivityRepository.findAndCountAll(
            {
              filter: {},
            },
            mockIRepositoryOptions,
          )
        ).rows

        const a0Id = activities.filter((a) => a.sourceId === sampleActivities[0].sourceId)[0].id

        const a1Id = activities.filter((a) => a.sourceId === sampleActivities[1].sourceId)[0].id

        const found2 = await TaskRepository.findAndCountAll(
          {
            filter: {
              activities: [a0Id, a1Id],
            },
          },
          mockIRepositoryOptions,
        )
        expect(found2.count).toBe(2)
      })
    })

    it('by activities and members', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [sampleMembers[0]],
        fromActivities: [sampleActivities[0]],
      })
      const toCreate2 = await getToCreate(
        {
          name: 'Task',
          status: 'in-progress',
          dueDate: moment().add(1, 'day').toDate(),
        },
        mockIRepositoryOptions,
        {
          fromMembers: [sampleMembers[1]],
          fromActivities: [sampleActivities[1]],
        },
      )
      const toCreate3 = await getToCreate(
        {
          name: 'Task 3',
          status: 'in-progress',
          dueDate: moment().add(1, 'day').toDate(),
        },
        mockIRepositoryOptions,
        {
          fromMembers: [],
          fromActivities: [sampleActivities[2]],
        },
      )
      await TaskRepository.create(toCreate1, mockIRepositoryOptions)
      await TaskRepository.create(toCreate2, mockIRepositoryOptions)
      await TaskRepository.create(toCreate3, mockIRepositoryOptions)

      await SequelizeTestUtils.refreshMaterializedViews(db)

      const members = (
        await MemberRepository.findAndCountAll(
          {
            filter: {},
          },
          mockIRepositoryOptions,
        )
      ).rows

      const m1Id = members.filter((m) => m.displayName === sampleMembers[1].displayName)[0].id

      const activities = (
        await ActivityRepository.findAndCountAll(
          {
            filter: {},
          },
          mockIRepositoryOptions,
        )
      ).rows

      const a1Id = activities.filter((a) => a.sourceId === sampleActivities[1].sourceId)[0].id
      const a2Id = activities.filter((a) => a.sourceId === sampleActivities[2].sourceId)[0].id

      const found = await TaskRepository.findAndCountAll(
        {
          filter: {
            activities: [a1Id],
            members: [m1Id],
          },
        },
        mockIRepositoryOptions,
      )
      expect(found.count).toBe(1)

      const found2 = await TaskRepository.findAndCountAll(
        {
          advancedFilter: {
            or: [
              {
                activities: [a2Id],
              },
              {
                members: [m1Id],
              },
            ],
          },
        },
        mockIRepositoryOptions,
      )
      expect(found2.count).toBe(2)

      const found3 = await TaskRepository.findAndCountAll(
        {
          advancedFilter: {
            activities: [a1Id],
            members: [m1Id],
          },
        },
        mockIRepositoryOptions,
      )
      expect(found3.count).toBe(1)
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created task', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [],
        fromActivities: [],
      })

      const taskCreated = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      const taskUpdated = await TaskRepository.update(
        taskCreated.id,
        { name: 'updated-task-name' },
        mockIRepositoryOptions,
      )

      expect(taskUpdated.updatedAt.getTime()).toBeGreaterThan(taskCreated.createdAt.getTime())

      taskUpdated.createdAt = taskUpdated.createdAt.toISOString().split('T')[0]
      taskUpdated.updatedAt = taskUpdated.updatedAt.toISOString().split('T')[0]
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      const taskExpected = {
        id: taskCreated.id,
        ...taskUpdated,
        name: taskUpdated.name,
        createdAt: taskUpdated.createdAt,
        updatedAt: taskUpdated.updatedAt,
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        members: [],
      }

      expect(taskUpdated).toStrictEqual(taskExpected)
    })

    it('Should succesfully update members related to the task', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [sampleMembers[0]],
        fromActivities: [],
      })

      const newMembers = (
        await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [sampleMembers[1]],
          fromActivities: [],
        })
      ).members

      const taskCreated = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      const taskUpdated = await TaskRepository.update(
        taskCreated.id,
        { members: newMembers },
        mockIRepositoryOptions,
      )

      taskUpdated.createdAt = taskUpdated.createdAt.toISOString().split('T')[0]
      taskUpdated.updatedAt = taskUpdated.updatedAt.toISOString().split('T')[0]
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      expect(taskUpdated.members.length).toBe(1)
      expect(taskUpdated.members[0].id).toStrictEqual(newMembers[0])
    })

    it('Should succesfully update activities related to the task', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [],
        fromActivities: [sampleActivities[0]],
      })

      const newActivities = (
        await getToCreate(toCreate, mockIRepositoryOptions, {
          fromMembers: [],
          fromActivities: [sampleActivities[1]],
        })
      ).activities

      const taskCreated = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      const taskUpdated = await TaskRepository.update(
        taskCreated.id,
        { activities: newActivities },
        mockIRepositoryOptions,
      )

      taskUpdated.createdAt = taskUpdated.createdAt.toISOString().split('T')[0]
      taskUpdated.updatedAt = taskUpdated.updatedAt.toISOString().split('T')[0]
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      expect(taskUpdated.activities.length).toBe(1)
      expect(taskUpdated.activities[0].id).toStrictEqual(newActivities[0])
    })

    it('Should succesfully update assignedTo', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const toCreate1 = await getToCreate(toCreate, mockIRepositoryOptions, {
        fromMembers: [],
        fromActivities: [],
      })

      const options2 = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const taskCreated = await TaskRepository.create(toCreate1, mockIRepositoryOptions)

      const toUpdate = options2.currentUser.id.toString()

      const taskUpdated = await TaskRepository.update(
        taskCreated.id,
        { assignedTo: toUpdate },
        mockIRepositoryOptions,
      )

      taskUpdated.createdAt = taskUpdated.createdAt.toISOString().split('T')[0]
      taskUpdated.updatedAt = taskUpdated.updatedAt.toISOString().split('T')[0]
      toCreate1.assignedToId = toCreate1.assignedTo
      delete toCreate1.assignedTo

      expect(taskUpdated.assignedToId).toBe(toUpdate)
    })

    it('Should throw 404 error when trying to update non existent task', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        TaskRepository.update(randomUUID(), { name: 'non-existent' }, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created task', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const task = { name: 'test-task' }

      const returnedTask = await TaskRepository.create(task, mockIRepositoryOptions)

      await TaskRepository.destroy(returnedTask.id, mockIRepositoryOptions, true)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        TaskRepository.findById(returnedTask.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent task', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        TaskRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
