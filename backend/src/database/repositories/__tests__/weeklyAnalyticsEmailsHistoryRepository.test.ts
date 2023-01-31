import { randomUUID } from 'crypto'

import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import { WeeklyAnalyticsEmailsHistoryData } from '../../../types/weeklyAnalyticsEmailsHistoryTypes'
import WeeklyAnalyticsEmailsHistoryRepository from '../weeklyAnalyticsEmailsHistoryRepository'

const db = null

describe('WeeklyAnalyticsEmailsHistory tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create weekly analytics email history with given values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const historyData: WeeklyAnalyticsEmailsHistoryData = {
        emailSentAt: '2023-01-02T00:00:00Z',
        emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
        tenantId: mockIRepositoryOptions.currentTenant.id,
        weekOfYear: '1',
      }

      const waeRepository = new WeeklyAnalyticsEmailsHistoryRepository(mockIRepositoryOptions)
      const history = await waeRepository.create(historyData)

      expect(new Date(historyData.emailSentAt)).toStrictEqual(history.emailSentAt)
      expect(historyData.emailSentTo).toStrictEqual(history.emailSentTo)
      expect(historyData.tenantId).toStrictEqual(history.tenantId)
      expect(historyData.weekOfYear).toStrictEqual(history.weekOfYear)
    })

    it('Should throw an error when mandatory fields are missing', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const waeRepository = new WeeklyAnalyticsEmailsHistoryRepository(mockIRepositoryOptions)
      await expect(() =>
        waeRepository.create({
          emailSentAt: '2023-01-02T00:00:00Z',
          emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
          tenantId: mockIRepositoryOptions.currentTenant.id,
          weekOfYear: undefined,
        }),
      ).rejects.toThrowError()

      await expect(() =>
        waeRepository.create({
          emailSentAt: undefined,
          emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
          tenantId: mockIRepositoryOptions.currentTenant.id,
          weekOfYear: '1',
        }),
      ).rejects.toThrowError()

      await expect(() =>
        waeRepository.create({
          emailSentAt: '2023-01-02T00:00:00Z',
          emailSentTo: undefined,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          weekOfYear: '1',
        }),
      ).rejects.toThrowError()

      await expect(() =>
        waeRepository.create({
          emailSentAt: '2023-01-02T00:00:00Z',
          emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
          tenantId: undefined,
          weekOfYear: '1',
        }),
      ).rejects.toThrowError()
    })
  })

  describe('findById method', () => {
    it('Should find historical receipt by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const historyData: WeeklyAnalyticsEmailsHistoryData = {
        emailSentAt: '2023-01-02T00:00:00Z',
        emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
        tenantId: mockIRepositoryOptions.currentTenant.id,
        weekOfYear: '1',
      }

      const waeRepository = new WeeklyAnalyticsEmailsHistoryRepository(mockIRepositoryOptions)

      const receiptCreated = await waeRepository.create(historyData)
      const receiptFoundById = await waeRepository.findById(receiptCreated.id)

      expect(receiptFoundById).toStrictEqual(receiptCreated)
    })

    it('Should return null for non-existing receipt entry', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const waeRepository = new WeeklyAnalyticsEmailsHistoryRepository(mockIRepositoryOptions)

      const cache = await waeRepository.findById(randomUUID())
      expect(cache).toBeNull()
    })
  })

  describe('findById method', () => {
    it('Should find historical receipt by week of year', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const historyData: WeeklyAnalyticsEmailsHistoryData = {
        emailSentAt: '2023-01-02T00:00:00Z',
        emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
        tenantId: mockIRepositoryOptions.currentTenant.id,
        weekOfYear: '1',
      }

      const waeRepository = new WeeklyAnalyticsEmailsHistoryRepository(mockIRepositoryOptions)

      const receiptCreated = await waeRepository.create(historyData)

      // should find recently created receipt
      let receiptFound = await waeRepository.findByWeekOfYear('1')

      expect(receiptCreated).toStrictEqual(receiptFound)

      // shouldn't find any receipts
      receiptFound = await waeRepository.findByWeekOfYear('2')

      expect(receiptFound).toBeNull()
    })
  })
})
