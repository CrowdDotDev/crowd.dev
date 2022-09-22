/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint class-methods-use-this: 0 */

import moment from 'moment'
import { BaseOutput, parseOutput, IntegrationResponse } from '../../types/iteratorTypes'
import { Endpoint, State } from '../../types/regularTypes'

import BaseIterator from '../baseIterator'
import { AddActivitiesSingle } from '../../types/messageTypes'

export default class TestIterator extends BaseIterator {
  n: number

  transitionFn: Function

  audits: Array<State>

  static limitReachedState: State = {
    endpoint: '__limit',
    endpoints: [],
    page: '__limit',
  }

  // Endpoints are hard-coded since they are fixed for each integration
  static endpoints = ['endpoint1', 'endpoint2', 'endpoint3']

  /**
   * Constructor for the TestIterator
   * @param state Start state
   * @param transitionFn A function of transitions given the number of iterations done.
   *                     It should return a new limit and a new page.
   */
  constructor(
    transitionFn: Function,
    state: State = { endpoint: '', page: '', endpoints: [] },
    onboarding: boolean = false,
    limitCount: number = 0,
  ) {
    super('dummytenant', TestIterator.endpoints, state, onboarding, 18, limitCount)
    this.n = 0
    this.transitionFn = transitionFn
    this.audits = []
  }

  /**
   * Simulate getting a response from an integration API
   * @param endpoint Dummy endpoint
   * @param page Page
   * @returns A response object
   */
  async get(endpoint: string, page: string): Promise<IntegrationResponse> {
    const records = [{ record1: 'here' }, { record2: 'there' }]

    const { nextPage, limit } = await this.transitionFn(this.n)

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          records,
          nextPage,
          limit,
          timeUntilReset: 100,
        })
      }, 100)
    })
  }

  /**
   * Check if the limit is reached
   * @param limit current request limit
   * @returns whether we have reached the limit
   */
  isLimitReached(limit: number): boolean {
    return limit <= 1
  }

  /**
   * Function called when the limit is reached.
   * Add a dummy limitReachedState to the audits for testing purposes
   * @param state The current state
   * @returns Dummy success status
   */
  async limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput> {
    this.audits.push(TestIterator.limitReachedState)
    this.audits.push(state)
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          status: 'limitReached',
          timeUntilReset,
        })
      }, 100)
    })
    return { status: 200, msg: 'limitReached' }
  }

  async parseActivitiesAndWrite(records: Array<object>, endpoint: string): Promise<parseOutput> {
    this.audits.push(this.state)

    const trResult = await this.transitionFn(this.n)

    const date: Date = trResult.date ? trResult.date : moment().utc().toDate()
    this.n += 1

    this.limitCount += records.length

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          lastRecord: {
            status: 200,
            timestamp: date,
          },
          numberOfRecords: records.length,
          activities: [],
        })
      }, 100)
    })
  }

  integrationSpecificIsEndpointFinished(
    endpoint: string,
    lastRecord: any,
    activities: Array<AddActivitiesSingle>,
  ): boolean {
    return BaseIterator.isDateTooOld(lastRecord.timestamp, moment().utc().unix() - 24 * 60 * 60)
  }

  async updateStatus(): Promise<void> {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({})
      }, 10)
    })
  }

  async iterate(maxTime: number = 12 * 60): Promise<BaseOutput> {
    return super.iterate(maxTime, false)
  }

  next(currentEndpoint: Endpoint, nextPage: string | undefined, parseOutput: parseOutput): State {
    const next = super.next(currentEndpoint, nextPage, parseOutput)
    if (this.audits.length > 0) {
      this.audits[this.audits.length - 1].endpoints = next.endpoints
    }
    return next
  }
}
