import moment from 'moment'
import BaseIterator from '../baseIterator'
import TestIterator from './testIterator'

describe('BaseIterator tests', () => {
  const recentActivity = {
    timestamp: moment().utc().toDate(),
  }
  const oldActivity = {
    timestamp: moment().utc().subtract(2, 'day').toDate(),
  }
  const success = { status: 200, msg: 'Finished' }
  const limitReached = { status: 200, msg: 'limitReached' }

  describe('next function tests', () => {
    it('It should throw an error when no endpoints are given', async () => {
      try {
        new TestIterator((n) => n).next('', '', {
          lastRecord: recentActivity,
          numberOfRecords: 10,
          activities: [],
        })
      } catch (error: any) {
        expect(error.message).toBe('currentEndpoint is empty')
      }
    })

    it('It should return the given endpoint and a page for a given next page', async () => {
      const next = new TestIterator((n) => n).next('endpoint1', '123', {
        lastRecord: recentActivity,
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual({
        endpoint: 'endpoint1',
        page: '123',
        endpoints: ['endpoint1', 'endpoint2', 'endpoint3'],
      })
    })

    it('It should return the next endpoint given and enpoint and no page', async () => {
      const next = new TestIterator((n) => n).next('endpoint1', '', {
        lastRecord: recentActivity,
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual({
        endpoint: 'endpoint2',
        page: '',
        endpoints: ['endpoint2', 'endpoint3'],
      })
    })

    it('It should return finish state given the last endpoint and no page', async () => {
      const next = new TestIterator((n) => n).next('endpoint3', '', {
        lastRecord: recentActivity,
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual(BaseIterator.endState)
    })
  })

  describe('Next function tests for isEndpointFinished', () => {
    // The testIterator is set to a maximum activity age of one week
    it('Should return the next endpoint when given an activity older than 1 day and a page', async () => {
      const next = new TestIterator((n) => n).next('endpoint1', '123', {
        lastRecord: oldActivity,
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual({
        endpoint: 'endpoint2',
        page: '',
        endpoints: ['endpoint2', 'endpoint3'],
      })
    })

    it('Should return the next endpoint when given a an activity older than 1 day and no page', async () => {
      const next = new TestIterator((n) => n).next('endpoint1', '', {
        lastRecord: oldActivity,
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual({
        endpoint: 'endpoint2',
        page: '',
        endpoints: ['endpoint2', 'endpoint3'],
      })
    })

    it('Should return the finished state when at the end even with an old date', async () => {
      const next = new TestIterator((n) => n).next('endpoint3', '', {
        lastRecord: oldActivity,
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual(BaseIterator.endState)
    })

    it('Should return the finished state when at the last endpoint with an old date', async () => {
      const next = new TestIterator((n) => n).next('endpoint3', 'p124', {
        lastRecord: oldActivity,
        numberOfRecords: 10,
        activities: [],
      })
      expect(next).toStrictEqual(BaseIterator.endState)
    })

    it('Should return the finished state when the last activity is empty', async () => {
      const next = new TestIterator((n) => n).next('endpoint1', '', {
        lastRecord: {},
        numberOfRecords: 5,
        activities: [],
      })
      expect(next).toStrictEqual({
        endpoint: 'endpoint2',
        page: '',
        endpoints: ['endpoint2', 'endpoint3'],
      })
    })
  })

  describe('pagination  tests', () => {
    it('Should iterate without pagination', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: '', limit: 9 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: '', limit: 8 } // in endpoint 2
        }
        return { nextPage: '', limit: 7 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()

      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: [] },
      ])
      expect(out).toStrictEqual(success)
    })

    it('Should iterate with pagination', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 8 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return { nextPage: 'p1', limit: 6 } // in endpoint 2
        }
        if (n === 4) {
          return { nextPage: 'p2', limit: 5 } // in endpoint 2
        }
        if (n === 5) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }
        if (n === 6) {
          return { nextPage: 'p1', limit: 3 } // in endpoint 3
        }

        return { nextPage: '', limit: 2 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: 'p1', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: 'p2', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: 'p1', endpoints: [] },
      ])
      expect(out).toStrictEqual(success)
    })

    it('Should iterate with irregular pagination', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 8 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }

        return { nextPage: '', limit: 3 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: [] },
      ])
      expect(out).toStrictEqual(success)
    })
  })

  describe('limit reached  tests', () => {
    it('Should stop when limit is reached', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }

        return { nextPage: 'p2', limit: 0 } // in endpoint 1
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        TestIterator.limitReachedState,
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
      ])
      expect(iter.state).toStrictEqual({
        endpoint: 'endpoint1',
        page: 'p2',
        endpoints: ['endpoint1', 'endpoint2', 'endpoint3'],
      })
      expect(out).toStrictEqual(limitReached)
    })

    it('Limit stop not depend on the iterator function (metatest)', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 0 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }

        return { nextPage: '', limit: 3 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        TestIterator.limitReachedState,
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
      ])
      expect(iter.state).toStrictEqual({
        endpoint: 'endpoint1',
        page: 'p2',
        endpoints: ['endpoint1', 'endpoint2', 'endpoint3'],
      })
      expect(out).toStrictEqual(limitReached)
    })

    it('Limit reached right after the last endpoint  is ignored', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 8 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }

        return { nextPage: '', limit: 0 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: [] },
      ])
      expect(iter.state).toStrictEqual(TestIterator.endState)
      expect(out).toStrictEqual(success)
    })

    it('Limit reached almost at the end', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 8 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }
        if (n === 4) {
          return { nextPage: 'p1', limit: 0 } // in endpoint 3
        }

        return { nextPage: '', limit: 10 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: ['endpoint3'] },
        TestIterator.limitReachedState,
        { endpoint: 'endpoint3', page: 'p1', endpoints: ['endpoint3'] },
      ])
      expect(iter.state).toStrictEqual({
        endpoint: 'endpoint3',
        page: 'p1',
        endpoints: ['endpoint3'],
      })
      expect(out).toStrictEqual(limitReached)
    })
  })

  describe('start state tests', () => {
    it('Should iterate without pagination given a start state', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: '', limit: 9 } // in endpoint 1
        }
        return { nextPage: '', limit: 7 } // in endpoint 3
      }

      const iter = new TestIterator(itFn, {
        endpoint: 'endpoint2',
        page: '',
        endpoints: [],
      })
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: [] },
      ])
      expect(out).toStrictEqual(success)
    })

    it('Should iterate with pagination', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p2', limit: 5 } // in endpoint 2
        }
        if (n === 1) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }
        if (n === 2) {
          return { nextPage: 'p1', limit: 3 } // in endpoint 3
        }

        return { nextPage: '', limit: 2 } // in endpoint 3
      }

      const iter = new TestIterator(itFn, {
        endpoint: 'endpoint2',
        page: 'p1',
        endpoints: ['endpoint2', 'endpoint3'],
      })
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint2', page: 'p1', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: 'p2', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: 'p1', endpoints: [] },
      ])
      expect(out).toStrictEqual(success)
    })

    it('Should iterate with start and limit reached', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p2', limit: 5 } // in endpoint 2
        }
        if (n === 1) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }
        if (n === 2) {
          return { nextPage: 'p1', limit: 0 } // in endpoint 3
        }

        return { nextPage: '', limit: 2 } // in endpoint 3
      }

      const iter = new TestIterator(itFn, {
        endpoint: 'endpoint2',
        page: 'p1',
        endpoints: ['endpoint2', 'endpoint3'],
      })
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint2', page: 'p1', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: 'p2', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: ['endpoint3'] },
        TestIterator.limitReachedState,
        { endpoint: 'endpoint3', page: 'p1', endpoints: ['endpoint3'] },
      ])
      expect(iter.state).toStrictEqual({
        endpoint: 'endpoint3',
        page: 'p1',
        endpoints: ['endpoint3'],
      })
      expect(out).toStrictEqual(limitReached)
    })
  })

  describe('Chain tests', () => {
    it('Stop state should be start state', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }

        return { nextPage: 'p2', limit: 0 } // in endpoint 1
      }

      const itFn2 = (n: number): Object => {
        if (n === 0) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }

        return { nextPage: '', limit: 3 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        TestIterator.limitReachedState,
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] }, // still all endpoints because next is not called
      ])
      expect(iter.state).toStrictEqual({
        endpoint: 'endpoint1',
        page: 'p2',
        endpoints: ['endpoint1', 'endpoint2', 'endpoint3'],
      })
      expect(out).toStrictEqual(limitReached)

      const iter2 = new TestIterator(itFn2, {
        endpoint: 'endpoint1',
        page: 'p2',
        endpoints: [],
      })
      const out2 = await iter2.iterate()
      expect(iter2.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: [] },
      ])
      expect(out2).toStrictEqual(success)
    })
  })

  describe('Skip endpoint at date tests', () => {
    it('Should stop when sending a date younger than 1 day from now', async () => {
      const itFn = (n: number): Object => {
        if (n === 0) {
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 8 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return {
            nextPage: 'p1',
            limit: 6,
            date: moment().utc().subtract(2, 'days').toDate(),
          } // in endpoint 2
        }
        if (n === 4) {
          return { nextPage: 'p3', limit: 5 } // in endpoint 2
        }
        if (n === 5) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }
        if (n === 6) {
          return { nextPage: 'p1', limit: 3 } // in endpoint 3
        }

        return { nextPage: '', limit: 2 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate()
      expect(out).toStrictEqual(TestIterator.success)
      expect(iter.audits).toStrictEqual([
        { endpoint: 'endpoint1', page: '', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p1', endpoints: ['endpoint1', 'endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint1', page: 'p2', endpoints: ['endpoint2', 'endpoint3'] },
        { endpoint: 'endpoint2', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: '', endpoints: ['endpoint3'] },
        { endpoint: 'endpoint3', page: 'p3', endpoints: [] },
      ])
    })
  })

  describe('Runtime limit test', () => {
    it('Should stop early when sending 1s limit', async () => {
      const itFn = async (n: number) => {
        if (n === 0) {
          await new Promise((resolve) => {
            setTimeout(resolve, 2 * 1000)
          })
          return { nextPage: 'p1', limit: 8 } // in endpoint 1
        }
        if (n === 1) {
          return { nextPage: 'p2', limit: 8 } // in endpoint 1
        }
        if (n === 2) {
          return { nextPage: '', limit: 7 } // in endpoint 1
        }
        if (n === 3) {
          return { nextPage: 'p1', limit: 6 } // in endpoint 2
        }
        if (n === 4) {
          return { nextPage: 'p3', limit: 5 } // in endpoint 2
        }
        if (n === 5) {
          return { nextPage: '', limit: 4 } // in endpoint 2
        }
        if (n === 6) {
          return { nextPage: 'p1', limit: 3 } // in endpoint 3
        }

        return { nextPage: '', limit: 2 } // in endpoint 3
      }

      const iter = new TestIterator(itFn)
      const out = await iter.iterate(1)
      expect(out).toStrictEqual(limitReached)
      expect(iter.audits.length).toBe(3)
    })
  })

  describe('isFinished tests', () => {
    const endpoints = ['endpoint1', 'endpoint2', 'endpoint3']
    it('Should return not finished for a nextPage given', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true)
      const nextPage = 'here'
      const isFinished = iter.isFinished(endpoints, 'endpoint2', nextPage)
      expect(isFinished).toBe(false)
    })

    it('Should return not finished for not nextPage given but in the middle of endpoints', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true)
      const nextPage = undefined
      const isFinished = iter.isFinished(endpoints, 'endpoint2', nextPage)
      expect(isFinished).toBe(false)
    })

    it('Should return not finished for page given and last endpoint', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true)
      const isFinished = iter.isFinished(endpoints, 'endpoint3', 'here')
      expect(isFinished).toBe(false)
    })

    it('Should return finished for no nextPage given and last endpoint', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true)
      const isFinished = iter.isFinished(endpoints, 'endpoint3', undefined)
      expect(isFinished).toBe(true)
    })
  })

  describe('Global limit reached before execution tests', () => {
    it('Should stop before iteration when the global limit or larger is provided as init count', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true, 18)
      const out = await iter.iterate()
      expect(out).toStrictEqual(TestIterator.success)
      expect(iter.audits).toStrictEqual([])
    })

    it('Should stop before iteration when the global limit or larger is provided as init count', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true, 25)
      const out = await iter.iterate()
      expect(out).toStrictEqual(TestIterator.success)
      expect(iter.audits).toStrictEqual([])
    })

    it('Should start before iteration when a small limit is provided as init count', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true, 5)
      const out = await iter.iterate()
      expect(out).toStrictEqual(TestIterator.success)
      expect(iter.audits).toStrictEqual([
        {
          endpoint: 'endpoint1',
          page: '',
          endpoints: ['endpoint2', 'endpoint3'],
        },
        {
          endpoint: 'endpoint2',
          page: '',
          endpoints: ['endpoint3'],
        },
        {
          endpoint: 'endpoint3',
          page: '',
          endpoints: [],
        },
      ])
    })

    it('Should stop when a limit almost as the global limit is provided', async () => {
      const iter = new TestIterator((n) => n, { endpoint: '', page: '', endpoints: [] }, true, 17)
      const out = await iter.iterate()
      expect(out).toStrictEqual(TestIterator.success)
      expect(iter.audits).toStrictEqual([
        {
          endpoint: 'endpoint1',
          page: '',
          endpoints: [],
        },
      ])
    })
  })
})
