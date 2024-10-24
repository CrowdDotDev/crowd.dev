import { randomUUID } from 'crypto'

import {
  RecurringEmailType,
  RecurringEmailsHistoryData,
} from '../../../types/recurringEmailsHistoryTypes'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import RecurringEmailsHistoryRepository from '../recurringEmailsHistoryRepository'

const db = null

describe('RecurringEmailsHistory tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create recurring email history with given values', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const historyData: RecurringEmailsHistoryData = {
        emailSentAt: '2023-01-02T00:00:00Z',
        type: RecurringEmailType.WEEKLY_ANALYTICS,
        emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
        tenantId: mockIRepositoryOptions.currentTenant.id,
        weekOfYear: '1',
      }

      const rehRepository = new RecurringEmailsHistoryRepository(mockIRepositoryOptions)
      const history = await rehRepository.create(historyData)

      expect(new Date(historyData.emailSentAt)).toStrictEqual(history.emailSentAt)
      expect(historyData.emailSentTo).toStrictEqual(history.emailSentTo)
      expect(historyData.tenantId).toStrictEqual(history.tenantId)
      expect(historyData.weekOfYear).toStrictEqual(history.weekOfYear)
    })

    it('Should throw an error when mandatory fields are missing', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const rehRepository = new RecurringEmailsHistoryRepository(mockIRepositoryOptions)
      await expect(() =>
        rehRepository.create({
          emailSentAt: '2023-01-02T00:00:00Z',
          emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
          tenantId: mockIRepositoryOptions.currentTenant.id,
          type: undefined,
        }),
      ).rejects.toThrowError()

      await expect(() =>
        rehRepository.create({
          emailSentAt: undefined,
          emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
          tenantId: mockIRepositoryOptions.currentTenant.id,
          weekOfYear: '1',
          type: RecurringEmailType.WEEKLY_ANALYTICS,
        }),
      ).rejects.toThrowError()

      await expect(() =>
        rehRepository.create({
          emailSentAt: '2023-01-02T00:00:00Z',
          emailSentTo: undefined,
          tenantId: mockIRepositoryOptions.currentTenant.id,
          weekOfYear: '1',
          type: RecurringEmailType.WEEKLY_ANALYTICS,
        }),
      ).rejects.toThrowError()

      await expect(() =>
        rehRepository.create({
          emailSentAt: '2023-01-02T00:00:00Z',
          emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
          tenantId: undefined,
          weekOfYear: '1',
          type: RecurringEmailType.WEEKLY_ANALYTICS,
        }),
      ).rejects.toThrowError()
    })
  })

  describe('findById method', () => {
    it('Should find historical receipt by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const historyData: RecurringEmailsHistoryData = {
        emailSentAt: '2023-01-02T00:00:00Z',
        emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
        tenantId: mockIRepositoryOptions.currentTenant.id,
        weekOfYear: '1',
        type: RecurringEmailType.WEEKLY_ANALYTICS,
      }

      const rehRepository = new RecurringEmailsHistoryRepository(mockIRepositoryOptions)

      const receiptCreated = await rehRepository.create(historyData)
      const receiptFoundById = await rehRepository.findById(receiptCreated.id)

      expect(receiptFoundById).toStrictEqual(receiptCreated)
    })

    it('Should return null for non-existing receipt entry', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const rehRepository = new RecurringEmailsHistoryRepository(mockIRepositoryOptions)

      const cache = await rehRepository.findById(randomUUID())
      expect(cache).toBeNull()
    })
  })

  describe('findByWeekOfYear method', () => {
    it('Should find historical receipt by week of year', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const historyData: RecurringEmailsHistoryData = {
        emailSentAt: '2023-01-02T00:00:00Z',
        emailSentTo: ['anil@crowd.dev', 'uros@crowd.dev'],
        tenantId: mockIRepositoryOptions.currentTenant.id,
        weekOfYear: '1',
        type: RecurringEmailType.EAGLE_EYE_DIGEST,
      }

      const rehRepository = new RecurringEmailsHistoryRepository(mockIRepositoryOptions)

      const receiptCreated = await rehRepository.create(historyData)

      // should find recently created receipt
      let receiptFound = await rehRepository.findByWeekOfYear(
        mockIRepositoryOptions.currentTenant.id,
        '1',
        RecurringEmailType.EAGLE_EYE_DIGEST,
      )

      expect(receiptCreated).toStrictEqual(receiptFound)

      // shouldn't find any receipts
      receiptFound = await rehRepository.findByWeekOfYear(
        mockIRepositoryOptions.currentTenant.id,
        '2',
        RecurringEmailType.EAGLE_EYE_DIGEST,
      )

      expect(receiptFound).toBeNull()
    })
  })
})
