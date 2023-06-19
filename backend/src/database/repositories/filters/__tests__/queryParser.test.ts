import Sequelize from 'sequelize'
import { generateUUIDv4 as uuid } from '@crowd/common'
import SequelizeTestUtils from '../../../utils/sequelizeTestUtils'
import QueryParser from '../queryParser'

const { Op } = Sequelize
const db = null

describe('QueryParser tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('Simple tests', () => {
    it('With empty values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {},
        orderBy: [],
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 10,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })
    it('With some filtering values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {
          body: {
            textContains: 'test',
          },
          or: [{ channel: 'dev' }, { channel: 'bugs' }],
        },
        orderBy: [],
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
          body: {
            [Op.iLike]: '%test%',
          },
          [Op.or]: [{ channel: 'dev' }, { channel: 'bugs' }],
        },
        limit: 10,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })
    it('With some sorting values: list', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {},
        orderBy: ['timestamp_DESC', 'channel_ASC'],
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 10,
        offset: 0,
        order: [
          ['timestamp', 'DESC'],
          ['channel', 'ASC'],
        ],
      }
      expect(parsed).toStrictEqual(expected)
    })

    it('With some sorting values: string', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {},
        orderBy: 'timestamp_DESC,channel_ASC',
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 10,
        offset: 0,
        order: [
          ['timestamp', 'DESC'],
          ['channel', 'ASC'],
        ],
      }
      expect(parsed).toStrictEqual(expected)
    })

    it('With offset', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {},
        orderBy: [],
        offset: 10,
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 10,
        offset: 10,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })

    it('With limit', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {},
        orderBy: [],
        limit: 100,
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 100,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })

    it('With too large limit', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {},
        orderBy: [],
        limit: 210,
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 200,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })

    it('With filtering, sorting, limit and offset', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {
          body: {
            textContains: 'test',
          },
          or: [{ channel: 'dev' }, { channel: 'bugs' }],
        },
        orderBy: ['timestamp_DESC', 'channel_ASC'],
        limit: 100,
        offset: 10,
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
          body: {
            [Op.iLike]: '%test%',
          },
          [Op.or]: [{ channel: 'dev' }, { channel: 'bugs' }],
        },
        limit: 100,
        offset: 10,
        order: [
          ['timestamp', 'DESC'],
          ['channel', 'ASC'],
        ],
      }
      expect(parsed).toStrictEqual(expected)
    })
  })

  describe('Complex filtering tests', () => {
    it('With nested fields', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser(
        {
          nestedFields: {
            sentiment: 'sentiment.sentiment',
            mood: 'sentiment.mood',
          },
        },
        mockIRepositoryOptions,
      )
      const parsed = parser.parse({
        filter: {
          sentiment: {
            gte: 0.5,
          },
          or: [{ mood: 'happy' }, { mood: 'sad' }],
        },
        orderBy: [],
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
          'sentiment.sentiment': {
            [Op.gte]: 0.5,
          },
          [Op.or]: [{ 'sentiment.mood': 'happy' }, { 'sentiment.mood': 'sad' }],
        },
        limit: 10,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })
    it('With complex operators', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser({}, mockIRepositoryOptions)
      const parsed = parser.parse({
        filter: {
          body: {
            textContains: 'test',
          },
        },
        orderBy: [],
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
          body: {
            [Op.iLike]: '%test%',
          },
        },
        limit: 10,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })
    it('With aggregators', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser(
        {
          aggregators: {
            count: mockIRepositoryOptions.database.Sequelize.fn(
              'COUNT',
              mockIRepositoryOptions.database.Sequelize.col('activities.id'),
            ),
            platform: Sequelize.literal(`"activities"."platform"`),
          },
        },
        mockIRepositoryOptions,
      )
      const parsed = parser.parse({
        filter: {
          or: [
            {
              platform: {
                in: ['discord', 'github'],
              },
            },
            {
              count: {
                gte: 10,
              },
            },
          ],
        },
        orderBy: [],
      })
      const expected = {
        having: {
          [Op.or]: [
            {
              [Op.and]: [
                Sequelize.where(
                  Sequelize.literal(`"activities"."platform"`),
                  Op.in,
                  Sequelize.literal(`('discord','github')`),
                ),
              ],
            },
            {
              [Op.and]: [
                Sequelize.where(
                  mockIRepositoryOptions.database.Sequelize.fn(
                    'COUNT',
                    mockIRepositoryOptions.database.Sequelize.col('activities.id'),
                  ),
                  Op.gte,
                  10,
                ),
              ],
            },
          ],
        },
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        limit: 10,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })
    it('With many to many relations', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser(
        {
          manyToMany: {
            members: {
              table: 'tasks',
              model: 'task',
              relationTable: {
                name: 'memberTasks',
                from: 'taskId',
                to: 'memberId',
              },
            },
            activities: {
              table: 'tasks',
              model: 'task',
              relationTable: {
                name: 'activityTasks',
                from: 'taskId',
                to: 'activityId',
              },
            },
          },
        },
        mockIRepositoryOptions,
      )

      const aid1 = uuid()
      const aid2 = uuid()
      const mid1 = uuid()

      const parsed = parser.parse({
        filter: {
          or: [
            {
              members: [mid1],
              activities: [aid1, aid2],
            },
            {
              status: {
                eq: 'some-task-name',
              },
            },
          ],
        },
        orderBy: [],
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
          [Op.or]: [
            {
              [Op.and]: [
                Sequelize.where(
                  Sequelize.literal(`"task"."id"`),
                  Op.in,
                  Sequelize.literal(
                    `(SELECT "tasks"."id" FROM "tasks" INNER JOIN "memberTasks" ON "memberTasks"."taskId" = "tasks"."id" WHERE  "memberTasks"."memberId"  = '${mid1}')`,
                  ),
                ),
                Sequelize.where(
                  Sequelize.literal(`"task"."id"`),
                  Op.in,
                  Sequelize.literal(
                    `(SELECT "tasks"."id" FROM "tasks" INNER JOIN "activityTasks" ON "activityTasks"."taskId" = "tasks"."id" WHERE  "activityTasks"."activityId"  = '${aid1}' OR "activityTasks"."activityId"  = '${aid2}')`,
                  ),
                ),
              ],
            },
            {
              status: {
                [Op.eq]: 'some-task-name',
              },
            },
          ],
        },
        limit: 10,
        offset: 0,
        order: [],
      }
      expect(parsed).toStrictEqual(expected)
    })
    it('With nested fields, complex operators, aggregators and many to many', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const parser = new QueryParser(
        {
          nestedFields: {
            sentiment: 'sentiment.sentiment',
            mood: 'sentiment.mood',
          },
          aggregators: {
            count: mockIRepositoryOptions.database.Sequelize.fn(
              'COUNT',
              mockIRepositoryOptions.database.Sequelize.col('activities.id'),
            ),
            platform: Sequelize.literal(`"activities"."platform"`),
          },
          manyToMany: {
            members: {
              table: 'tasks',
              model: 'task',
              relationTable: {
                name: 'memberTasks',
                from: 'taskId',
                to: 'memberId',
              },
            },
            activities: {
              table: 'tasks',
              model: 'task',
              relationTable: {
                name: 'activityTasks',
                from: 'taskId',
                to: 'activityId',
              },
            },
          },
        },
        mockIRepositoryOptions,
      )

      const aid1 = uuid()
      const aid2 = uuid()

      const parsed = parser.parse({
        filter: {
          sentiment: {
            gte: 0.5,
          },
          or: [
            {
              description: {
                textContains: 'test',
              },
            },
            {
              and: [
                {
                  platform: {
                    in: ['discord', 'github'],
                  },
                },
                {
                  count: {
                    lt: 10,
                  },
                },
              ],
            },
            {
              activities: [aid1, aid2],
            },
          ],
        },
        orderBy: ['dueDate_DESC', 'createdAt_ASC'],
        offset: 102,
        limit: 101,
      })
      const expected = {
        where: {
          tenantId: mockIRepositoryOptions.currentTenant.id,
          segmentId: mockIRepositoryOptions.currentSegments.map((s) => s.id),
        },
        having: {
          'sentiment.sentiment': {
            [Op.gte]: 0.5,
          },
          [Op.or]: [
            {
              description: {
                [Op.iLike]: '%test%',
              },
            },
            {
              [Op.and]: [
                {
                  [Op.and]: [
                    Sequelize.where(
                      Sequelize.literal(`"activities"."platform"`),
                      Op.in,
                      Sequelize.literal(`('discord','github')`),
                    ),
                  ],
                },
                {
                  [Op.and]: [
                    Sequelize.where(
                      mockIRepositoryOptions.database.Sequelize.fn(
                        'COUNT',
                        mockIRepositoryOptions.database.Sequelize.col('activities.id'),
                      ),
                      Op.lt,
                      10,
                    ),
                  ],
                },
              ],
            },
            {
              [Op.and]: [
                Sequelize.where(
                  Sequelize.literal(`"task"."id"`),
                  Op.in,
                  Sequelize.literal(
                    `(SELECT "tasks"."id" FROM "tasks" INNER JOIN "activityTasks" ON "activityTasks"."taskId" = "tasks"."id" WHERE  "activityTasks"."activityId"  = '${aid1}' OR "activityTasks"."activityId"  = '${aid2}')`,
                  ),
                ),
              ],
            },
          ],
        },
        limit: 101,
        offset: 102,
        order: [
          ['dueDate', 'DESC'],
          ['createdAt', 'ASC'],
        ],
      }
      expect(parsed).toStrictEqual(expected)
    })
  })
})
