import moment from 'moment'
import BaseIterator from '../baseIterator'

describe('Integrations worker static tests', () => {
  const endpoints = ['endpoint1', 'endpoint2', 'endpoint3']
  describe('Get iterator tests', () => {
    it('Should return the endpoints to iterate for a standard state', async () => {
      const state = { endpoint: 'endpoint2', page: 'here' }
      const iterator = BaseIterator.getEndPointsIterator(endpoints, state)

      expect(iterator).toStrictEqual(['endpoint2', 'endpoint3'])
    })

    it('Should return the endpoints to iterate for a state with no page', async () => {
      const state = { endpoint: 'endpoint2', page: '' }
      const iterator = BaseIterator.getEndPointsIterator(endpoints, state)

      expect(iterator).toStrictEqual(['endpoint2', 'endpoint3'])
    })

    it('Should return the whole endpoints when the state is in the first endpoint with a page', async () => {
      const state = { endpoint: 'endpoint1', page: 'here' }
      const iterator = BaseIterator.getEndPointsIterator(endpoints, state)

      expect(iterator).toStrictEqual(endpoints)
    })

    it('Should return the last endpoint when the state is in the last endpoint', async () => {
      const state = { endpoint: 'endpoint3', page: '' }
      const iterator = BaseIterator.getEndPointsIterator(endpoints, state)

      expect(iterator).toStrictEqual(['endpoint3'])
    })

    it('Should throw an error when state.endpoint is not in endpoints', async () => {
      const state = { endpoint: 'endpoint4', page: '' }
      try {
        BaseIterator.getEndPointsIterator(endpoints, state)
      } catch (error: any) {
        expect(error.message).toBe('endpoint4 is not in the possible endpoints')
      }
    })
  })

  describe('initState tests', () => {
    const endpoints = ['endpoint1', 'endpoint2', 'endpoint3']
    it('Should return the first endpoint and an empty page given an empty start state', async () => {
      const state = BaseIterator.initState(endpoints, {
        endpoint: '',
        page: '',
      })
      expect(state).toStrictEqual({
        endpoint: 'endpoint1',
        page: '',
      })
    })

    it('Should return the given state', async () => {
      const givenState = {
        endpoint: 'endpoint2',
        page: 'here',
      }
      const state = BaseIterator.initState(endpoints, givenState)
      expect(state).toStrictEqual(givenState)
    })
  })

  describe('Seconds until timestamp tests', () => {
    it('Should return the seconds until a future timestamp', async () => {
      const now = moment().utc().toDate()
      const future = moment().utc().add(142, 'seconds')
      const unix = future.unix()

      const secondsToGo = BaseIterator.secondsUntilTimestamp(unix, now)
      expect(secondsToGo).toBe(Math.floor(142 * 1.25))
    })

    it('Should work when no date given', async () => {
      const unix = moment().utc().add(142, 'seconds').unix()

      const secondsToGo = BaseIterator.secondsUntilTimestamp(unix)
      expect(secondsToGo).toBeLessThanOrEqual(Math.floor(142 * 1.25))
      expect(secondsToGo).toBeGreaterThanOrEqual(Math.floor(142))
    })

    it('Should work when no date given', async () => {
      const unix = moment().utc().subtract(142, 'seconds').unix()

      const secondsToGo = BaseIterator.secondsUntilTimestamp(unix)
      expect(secondsToGo).toBe(3 * 60)
    })
  })

  describe('IsDateTooOld test', () => {
    it('Should return true when the date is older than the timestsmp', async () => {
      // Date is now
      const now = moment().utc().toDate()
      // Timestamp is slightly in the future, so date is older
      const unix = moment().utc().add(142, 'seconds').unix()

      const isDateTooOld = BaseIterator.isDateTooOld(now, unix)
      expect(isDateTooOld).toBe(true)
    })

    it('Should return false when the date is not older than the timestsmp', async () => {
      // Date is now
      const now = moment().utc().toDate()
      // Timestamp is slightly in the future, so date is older
      const unix = moment().utc().subtract(142, 'seconds').unix()

      const isDateTooOld = BaseIterator.isDateTooOld(now, unix)
      expect(isDateTooOld).toBe(false)
    })
  })

  describe('Time since timestamp test', () => {
    function sleep(seconds: number) {
      return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000)
      })
    }

    it('Should return the number of seconds the program has slept for', async () => {
      const timestamp = moment().utc().unix()
      await sleep(2)
      const seconds = BaseIterator.timeSinceTimestamp(timestamp)
      expect(seconds).toBeCloseTo(2)
    })

    it('Should return the number of seconds the program has slept for', async () => {
      const timestamp = moment().utc().unix()
      const seconds = BaseIterator.timeSinceTimestamp(timestamp)
      expect(seconds).toBeCloseTo(0)
    })
  })
})
