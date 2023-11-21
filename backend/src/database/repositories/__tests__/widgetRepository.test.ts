import { Error404 } from '@crowd/common'
import WidgetRepository from '../widgetRepository'
import ReportRepository from '../reportRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'

const db = null

describe('WidgetRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create a widget succesfully with default values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget2Add = { type: 'test-widget' }

      const widgetCreated = await WidgetRepository.create(widget2Add, mockIRepositoryOptions)

      widgetCreated.createdAt = widgetCreated.createdAt.toISOString().split('T')[0]
      widgetCreated.updatedAt = widgetCreated.updatedAt.toISOString().split('T')[0]

      const widgetExpected = {
        id: widgetCreated.id,
        type: widget2Add.type,
        title: null,
        settings: null,
        cache: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        reportId: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        report: null,
      }

      expect(widgetCreated).toStrictEqual(widgetExpected)
    })

    it('Should create a widget succesfully with given values -- without report', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget2Add = {
        type: 'test-widget',
        title: 'Activities by Date',
        settings: {
          chartType: 'line',
          query: {
            measures: ['Activities.activityCount'],
            timeDimensions: [
              {
                dimension: 'Activities.date',
                granularity: 'week',
                dateRange: 'Last 30 days',
              },
            ],
            limit: 10000,
          },
          layout: {
            x: 6,
            y: 0,
            w: 6,
            h: 18,
            i: '620d303b0895bb8bee0a7e24',
            moved: false,
          },
        },
      }

      const widgetCreated = await WidgetRepository.create(widget2Add, mockIRepositoryOptions)

      widgetCreated.createdAt = widgetCreated.createdAt.toISOString().split('T')[0]
      widgetCreated.updatedAt = widgetCreated.updatedAt.toISOString().split('T')[0]

      // Trim the report object, we'll only expect the reportId
      const { report: _reportObj, ...widgetWithoutReport } = widgetCreated

      const widgetExpected = {
        id: widgetCreated.id,
        type: widget2Add.type,
        title: widget2Add.title,
        settings: widget2Add.settings,
        cache: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        reportId: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(widgetWithoutReport).toStrictEqual(widgetExpected)
    })

    it('Should create a widget succesfully with given values -- with report', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const report2Add = {
        name: 'test-report',
        public: true,
      }

      const reportCreated = await ReportRepository.create(report2Add, mockIRepositoryOptions)

      const widget2Add = {
        type: 'test-widget',
        title: 'Activities by Date',
        report: reportCreated.id,
        settings: {
          chartType: 'line',
          query: {
            measures: ['Activities.activityCount'],
            timeDimensions: [
              {
                dimension: 'Activities.date',
                granularity: 'week',
                dateRange: 'Last 30 days',
              },
            ],
            limit: 10000,
          },
          layout: {
            x: 6,
            y: 0,
            w: 6,
            h: 18,
            i: '620d303b0895bb8bee0a7e24',
            moved: false,
          },
        },
      }

      const widgetCreated = await WidgetRepository.create(widget2Add, mockIRepositoryOptions)

      widgetCreated.createdAt = widgetCreated.createdAt.toISOString().split('T')[0]
      widgetCreated.updatedAt = widgetCreated.updatedAt.toISOString().split('T')[0]

      // Trim the report object, we'll only expect the reportId
      const { report: _reportObj, ...widgetWithoutReport } = widgetCreated

      const widgetExpected = {
        id: widgetCreated.id,
        type: widget2Add.type,
        title: widget2Add.title,
        settings: widget2Add.settings,
        cache: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        reportId: reportCreated.id,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      expect(widgetWithoutReport).toStrictEqual(widgetExpected)
    })

    it('Should throw sequelize not null error -- type field is required', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget2Add = {}

      await expect(() =>
        WidgetRepository.create(widget2Add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })
  })

  describe('findById method', () => {
    it('Should successfully find created widget by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget2add = { type: 'test-widget' }

      const widgetCreated = await WidgetRepository.create(widget2add, mockIRepositoryOptions)

      widgetCreated.createdAt = widgetCreated.createdAt.toISOString().split('T')[0]
      widgetCreated.updatedAt = widgetCreated.updatedAt.toISOString().split('T')[0]

      const widgetExpected = {
        id: widgetCreated.id,
        type: widget2add.type,
        title: null,
        settings: null,
        cache: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        reportId: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      const widgetById = await WidgetRepository.findById(widgetCreated.id, mockIRepositoryOptions)

      widgetById.createdAt = widgetById.createdAt.toISOString().split('T')[0]
      widgetById.updatedAt = widgetById.updatedAt.toISOString().split('T')[0]

      const { report: _reportObj, ...widgetWithoutReport } = widgetById

      expect(widgetWithoutReport).toStrictEqual(widgetExpected)
    })

    it('Should throw 404 error when no widget found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        WidgetRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('findByType method', () => {
    it('Should successfully find one widget by type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widgetCreated = await WidgetRepository.create(
        { type: 'test-widget' },
        mockIRepositoryOptions,
      )

      widgetCreated.createdAt = widgetCreated.createdAt.toISOString().split('T')[0]
      widgetCreated.updatedAt = widgetCreated.updatedAt.toISOString().split('T')[0]

      const widgetExpected = {
        id: widgetCreated.id,
        type: widgetCreated.type,
        title: null,
        settings: null,
        cache: null,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        reportId: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      const widgetByType = await WidgetRepository.findByType(
        widgetCreated.type,
        mockIRepositoryOptions,
      )

      widgetByType.createdAt = widgetByType.createdAt.toISOString().split('T')[0]
      widgetByType.updatedAt = widgetByType.updatedAt.toISOString().split('T')[0]

      const { report: _reportObj, ...widgetWithoutReport } = widgetByType

      expect(widgetWithoutReport).toStrictEqual(widgetExpected)
    })

    it('Should throw 404 error when no widget found with given type', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      await WidgetRepository.create({ type: 'some-type' }, mockIRepositoryOptions)

      await expect(() =>
        WidgetRepository.findByType('some-other-type', mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created widget entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget1 = { type: 'widget-test1' }
      const widget2 = { type: 'widget-test2' }

      const widget1Created = await WidgetRepository.create(widget1, mockIRepositoryOptions)
      const widget2Created = await WidgetRepository.create(widget2, mockIRepositoryOptions)

      const filterIdsReturned = await WidgetRepository.filterIdsInTenant(
        [widget1Created.id, widget2Created.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([widget1Created.id, widget2Created.id])
    })

    it('Should only return the ids of previously created widgets and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget = { type: 'widget-test' }

      const widgetCreated = await WidgetRepository.create(widget, mockIRepositoryOptions)

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await WidgetRepository.filterIdsInTenant(
        [widgetCreated.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([widgetCreated.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget = { type: 'widget-test' }

      const widgetCreated = await WidgetRepository.create(widget, mockIRepositoryOptions)

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await WidgetRepository.filterIdsInTenant(
        [widgetCreated.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('findAndCountAll method', () => {
    it('Should find and count all widgets, with various filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const report1 = { name: 'test-report', public: true }
      const report2 = { name: 'test-report', public: true }

      const report1Created = await ReportRepository.create(report1, mockIRepositoryOptions)
      const report2Created = await ReportRepository.create(report2, mockIRepositoryOptions)

      const widget1 = {
        title: 'Number of activities - graph',
        type: 'number-activities-graph',
        report: report1Created.id,
        settings: {
          l1_settings: {
            l2_settings: {
              values: ['test2'],
            },
            values: ['test1'],
          },
        },
      }

      const widget2 = {
        title: 'Time to first interaction - graph',
        type: 'time-to-first-interaction-graph',
        report: report1Created.id,
        settings: {
          l1_settings: {
            l2_settings: {
              values: ['test2'],
            },
            values: ['test1'],
          },
        },
      }

      const widget3 = {
        title: 'Some cubejs widget',
        type: 'cubejs',
        report: report2Created.id,
      }
      const widget4 = { type: 'number-activities' }

      const widget1Created = await WidgetRepository.create(widget1, mockIRepositoryOptions)
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const widget2Created = await WidgetRepository.create(widget2, mockIRepositoryOptions)
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const widget3Created = await WidgetRepository.create(widget3, mockIRepositoryOptions)
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const widget4Created = await WidgetRepository.create(widget4, mockIRepositoryOptions)

      // Filter by type
      // Current findAndCountAll uses wildcarded like statement so it matches both widget1 and widget4
      let widgets = await WidgetRepository.findAndCountAll(
        { filter: { type: 'number-activities' } },
        mockIRepositoryOptions,
      )

      expect(widgets.count).toEqual(2)
      expect(widgets.rows).toStrictEqual([widget4Created, widget1Created])

      // Filter by id
      widgets = await WidgetRepository.findAndCountAll(
        { filter: { id: widget1Created.id } },
        mockIRepositoryOptions,
      )

      expect(widgets.count).toEqual(1)
      expect(widgets.rows).toStrictEqual([widget1Created])

      // Filter by createdAt - find all between widget1.createdAt and widget3.createdAt
      widgets = await WidgetRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [widget1Created.createdAt, widget3Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )

      expect(widgets.count).toEqual(3)
      expect(widgets.rows).toStrictEqual([widget3Created, widget2Created, widget1Created])

      // Filter by createdAt - find all where createdAt < widget2.createdAt
      widgets = await WidgetRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, widget2Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(widgets.count).toEqual(2)
      expect(widgets.rows).toStrictEqual([widget2Created, widget1Created])

      // Filter by createdAt - find all where createdAt < widget1.createdAt
      widgets = await WidgetRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, widget1Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(widgets.count).toEqual(1)
      expect(widgets.rows).toStrictEqual([widget1Created])

      // Filter by title
      widgets = await WidgetRepository.findAndCountAll(
        { filter: { title: 'graph' } },
        mockIRepositoryOptions,
      )

      expect(widgets.count).toEqual(2)
      expect(widgets.rows).toStrictEqual([widget2Created, widget1Created])

      // Filter by report1
      widgets = await WidgetRepository.findAndCountAll(
        { filter: { report: report1Created.id } },
        mockIRepositoryOptions,
      )

      expect(widgets.count).toEqual(2)
      expect(widgets.rows).toStrictEqual([widget2Created, widget1Created])

      // Filter by report2
      widgets = await WidgetRepository.findAndCountAll(
        { filter: { report: report2Created.id } },
        mockIRepositoryOptions,
      )

      expect(widgets.count).toEqual(1)
      expect(widgets.rows).toStrictEqual([widget3Created])
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created widget', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget1 = { type: 'widget-test' }

      const widgetCreated = await WidgetRepository.create(widget1, mockIRepositoryOptions)

      // Test adding report to widget on update as well
      const report = { name: 'test-report', public: true }

      const reportCreated = await ReportRepository.create(report, mockIRepositoryOptions)

      const widgetUpdated = await WidgetRepository.update(
        widgetCreated.id,
        {
          type: 'updated-widget-type',
          title: 'new-title',
          report: reportCreated.id,
        },
        mockIRepositoryOptions,
      )

      expect(widgetUpdated.updatedAt.getTime()).toBeGreaterThan(widgetUpdated.createdAt.getTime())

      const widgetExcpected = {
        id: widgetCreated.id,
        type: widgetUpdated.type,
        title: widgetUpdated.title,
        settings: null,
        cache: null,
        importHash: null,
        createdAt: widgetCreated.createdAt,
        updatedAt: widgetUpdated.updatedAt,
        deletedAt: null,
        reportId: reportCreated.id,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        segmentId: mockIRepositoryOptions.currentSegments[0].id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }

      const { report: _reportObj, ...widgetWithoutReport } = widgetUpdated

      expect(widgetWithoutReport).toStrictEqual(widgetExcpected)
    })

    it('Should throw 404 error when trying to update non existent widget', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        WidgetRepository.update(randomUUID(), { type: 'non-existent' }, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created widget', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const widget = {
        type: 'integrations',
        title: 'Metric graph',
      }

      const returnedWidget = await WidgetRepository.create(widget, mockIRepositoryOptions)

      await WidgetRepository.destroy(returnedWidget.id, mockIRepositoryOptions, true)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        WidgetRepository.findById(returnedWidget.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent widget', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        WidgetRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
