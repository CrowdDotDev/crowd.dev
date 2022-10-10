import lodash from 'lodash'
import moment from 'moment'
import crypto from 'crypto'
import { SuperfaceClient } from '@superfaceai/one-sdk'
import { IS_TEST_ENV, KUBE_MODE } from '../../../config/index'
import { parseOutput, IntegrationResponse, BaseOutput } from '../types/iteratorTypes'

import { State, Endpoint, Endpoints } from '../types/regularTypes'
import { AddActivitiesSingle } from '../types/messageTypes'

export default abstract class BaseIterator {
  tenant: string

  endpoints: Endpoints

  state: State

  endpointsIterator: Endpoints

  onboarding: boolean

  limitCount: number

  globalLimit: number

  startTimestamp: number

  static endState: State = {
    endpoints: [],
    endpoint: '__finished',
    page: '__finished',
  }

  // We multiply the runtime by 1.25 to make sure Lambda does not reahc
  // the time limit before the iteration is done
  static timePadding: number = 1.25

  static maxRetrospect = Infinity

  static success: Object = { status: 200, msg: 'Finished' }

  /**
   * Base iterator class. It performs the iterating logic,
   * including transitions between states, checking for time and API limits,
   * and calling the functions to get date and parse responses.
   * The class is abstract and has to be implemented by the child classes.
   * @param tenant The tenant to iterate over
   * @param endPoints The list of endpoints to iterate over
   * @param state The start state. Leave empty to start at the beginning
   */
  constructor(
    tenant: string,
    endPoints: Endpoints,
    state: State = { endpoint: '', page: '', endpoints: [] },
    onboarding: boolean = false,
    globalLimit: number = Infinity,
    limitCount: number = 0,
  ) {
    this.tenant = tenant

    if (state.endpoints.length > 0 && state.endpoint) {
      this.endpoints = state.endpoints
    } else {
      this.endpoints = endPoints
    }

    this.state = BaseIterator.initState(this.endpoints, state)

    this.startTimestamp = moment().utc().unix()

    // The endpoints we need to iterate over depend on the current state and the list of all endpoints
    this.endpointsIterator = BaseIterator.getEndPointsIterator(this.endpoints, this.state)

    this.onboarding = onboarding

    this.limitCount = limitCount
    this.globalLimit = globalLimit
  }

  /** Abstract methods to be defined in child classes */
  abstract get(endpoint: string, page: string): Promise<IntegrationResponse>

  abstract parseActivitiesAndWrite(records: Array<object>, endpoint: Endpoint): Promise<parseOutput>

  abstract isLimitReached(limit: number): boolean

  abstract integrationSpecificIsEndpointFinished(
    endpoint: Endpoint,
    lastRecord: object,
    activities: Array<AddActivitiesSingle>,
  ): boolean

  abstract limitReachedFunction(state: State, timeUntilReset: number): Promise<BaseOutput>

  abstract updateStatus(): Promise<void>

  /**
   * Iteration logic
   * @param maxTime The maximum runtime the function can take, in seconds
   * @returns A success state if the iteration has finished. Otherwise a limit reached state,
   *          which sends a message to start another iteration.
   */
  async iterate(maxTime: number = 12 * 60, log: boolean = true): Promise<any> {
    // We need to iterate until the endState is reached,
    // or until the loop is broken (return) by a limit reached state

    if (this.limitCount >= this.globalLimit) {
      this.state = BaseIterator.endState
      if (log) {
        console.log('Global limit reached before execution')
      }
    }

    while (this.state !== BaseIterator.endState) {
      // Get the current endpoint and page
      const { endpoint, page } = this.state

      // Get the response from the API and parse it.
      // We also get the date of the latest activity
      const response: IntegrationResponse = await this.get(endpoint, page)

      // Check if we have any records. If we do call the parse function to parse the records,
      // send the SQS messages and get the date of the latest activity

      let parseOutput: parseOutput
      if (response.records.length > 0) {
        parseOutput = await this.parseActivitiesAndWrite(response.records, this.state.endpoint)
      } else {
        parseOutput = {
          lastRecord: {},
          numberOfRecords: 0,
          activities: [],
        }
      }

      const timeSinceStart: number = BaseIterator.timeSinceTimestamp(this.startTimestamp)

      if (log) {
        console.log('========================================================')
        // console.log('State: ', this.state)
        console.log('Response length: ', response.records.length)
        console.log('Limit', response.limit)
        console.log('Last record: ', parseOutput.lastRecord)
        console.log('Time since start: ', timeSinceStart)
        console.log('Count towards limit: ', this.limitCount, ' / ', this.globalLimit)
      }
      // Get the next state
      this.state = this.next(endpoint, response.nextPage, parseOutput)
      this.endpoints = this.state.endpoints

      // If we are not done
      if (this.state !== BaseIterator.endState) {
        // If the request liit has been reached, return a limit reached state
        // with the proper waiting time
        if (this.isLimitReached(response.limit)) {
          if (log) {
            console.log('Response limit reached')
          }

          // TODO-kube
          if (KUBE_MODE) {
            console.log(`Waiting to continue for ${response.timeUntilReset} seconds!`)
            await BaseIterator.sleep(response.timeUntilReset)
          } else {
            return this.limitReachedFunction(this.state, response.timeUntilReset)
          }
        }
        // If the time elapsed is bigger than the max time, return a limit reached state
        // with a waiting time of 0 (no waiting needed, just a fresh function)
        // TODO-kube
        if (!KUBE_MODE && timeSinceStart >= maxTime) {
          console.log('time limit reached')
          return this.limitReachedFunction(this.state, 0)
        }
      }
    }
    if (log) {
      console.log('========================================================')
      console.log(BaseIterator.success)
    }

    await this.updateStatus()

    return BaseIterator.success
  }

  /**
   * Some activities will not have a remote(API) counterparts so they will miss sourceIds.
   * Since we're using sourceIds to find out if an activity already exists in our DB,
   * sourceIds are required when creating an activity.
   * This function generates an md5 hash that can be used as a sourceId of an activity.
   * Prepends string `gen-` to the beginning so generated and remote sourceIds
   * can be distinguished.
   *
   * @param {string} uniqueMemberRemoteId remote member id from an integration. This id needs to be unique in a platform
   * @param {string} type type of the activity
   * @param {string} timestamp unix timestamp of the activity
   * @param {string} platform platform of the activity
   * @returns 32 bit md5 hash generated from the given data, prepended with string `gen-`
   */
  static generateSourceIdHash(
    uniqueRemoteId: string,
    type: string,
    timestamp: string,
    platform: string,
  ) {
    if (uniqueRemoteId === '' || type === '' || timestamp === '' || platform === '') {
      throw new Error('Bad hash input')
    }

    const data = `${uniqueRemoteId}-${type}-${timestamp}-${platform}`
    return `gen-${crypto.createHash('md5').update(data).digest('hex')}`
  }

  /**
   * Calculate time elapsed since a timestamp in seconds
   * @param timestamp Unix timestamp to compare to
   * @returns Time since timestamp (in seconds)
   */
  static timeSinceTimestamp(timestamp: number): number {
    return moment().utc().unix() - timestamp
  }

  /**
   * Compare whether a date is older than a unix timestamp
   * @param date The date returned from the parser
   * @param unixTimestamp Unix timestamp to compare to
   * @returns Boolean whether the date is older than the unix timestamp
   */
  static isDateTooOld(date: Date, unixTimestamp: number): boolean {
    return moment.utc(date).unix() < unixTimestamp
  }

  /**
   * Gets the list of endpoints to iterate over given a list of total endpoints
   * and an initial state.
   * @returns {Array<string>} The iterator of the endpoints for the API
   */
  static getEndPointsIterator(endpoints: Endpoints, state: State): Array<string> {
    // If we already have an endpoint in the state, we only need to iterate over the rest of the endpoints
    const index: number = state.endpoint ? endpoints.indexOf(state.endpoint) : 0
    return endpoints.slice(index)
  }

  /**
   * Get the start state for iteration. If the state given as an input is empty,
   * get the first endpoint with an empty next page. If the state is not empty,
   * return the state.
   * @param endpoints The complete set of endpoints
   * @param startState The start state given
   * @returns The start state to use for iteration
   */
  static initState(endpoints: Endpoints, startState: State): State {
    return lodash.isEqual(startState, {
      endpoint: '',
      page: '',
      endpoints: [],
    })
      ? { endpoint: endpoints[0], page: '', endpoints }
      : startState
  }

  /**
   * Wrapper function to check if we are done with an endpoint.
   * If we did not get activities we are done regardless of the integration
   * Else If we are onboarding we carry on
   * Otherwise, we do an integration specific check
   * @param endpoint The endpoint we are checking
   * @param lastRecord The last parsed record
   * @returns Whether we are done with the endpoint or not
   */
  isEndpointFinished(
    endpoint: Endpoint,
    lastRecord: object,
    activities: Array<AddActivitiesSingle>,
  ): boolean {
    if (lodash.isEmpty(lastRecord)) {
      return true
    }
    if (this.onboarding) {
      return false
    }
    return this.integrationSpecificIsEndpointFinished(endpoint, lastRecord, activities)
  }

  /**
   * Get the next state given an API response and the current endpoint
   * @param currentEndpoint The current endpoint iterating over
   * @param nextPage The next page returned by the API
   * @returns The next state, or false if we have reached an end
   */
  next(currentEndpoint: Endpoint, nextPage: string | undefined, parseOutput: parseOutput): State {
    if (!currentEndpoint) {
      throw new Error('currentEndpoint is empty')
    }
    // If we have reached the end, return the end state
    else if (this.isFinished(this.endpointsIterator, currentEndpoint, nextPage)) {
      return BaseIterator.endState
    }
    // If we have found a date that is older than the stop date, then we can move on to the next endpoint
    // Also, if the number of records in the current endpoint is bigger than the limit, we can move on to the next endpoint
    else if (
      this.isEndpointFinished(currentEndpoint, parseOutput.lastRecord, parseOutput.activities)
    ) {
      // If we were already at the last endpoint we are finished
      const isLast: boolean =
        this.endpointsIterator.indexOf(currentEndpoint) === this.endpointsIterator.length - 1
      return isLast
        ? BaseIterator.endState
        : {
            endpoint: this.endpointsIterator[this.endpointsIterator.indexOf(currentEndpoint) + 1],
            page: '',
            endpoints: this.endpoints.slice(this.endpoints.indexOf(currentEndpoint) + 1),
          }
    }
    // If we do not have a next page, return the next endpoint with an empty page and 0 for number
    // Otherwise, increase the number by one, return the same endpoint and the next page
    return {
      endpoint: nextPage
        ? currentEndpoint
        : this.endpointsIterator[this.endpointsIterator.indexOf(currentEndpoint) + 1],
      page: nextPage || '',
      endpoints: nextPage
        ? this.endpoints
        : this.endpoints.slice(this.endpoints.indexOf(currentEndpoint) + 1),
    }
  }

  /**
   * Check whether there are more pages or endpoints to iterate over
   * @param currentEndpoint The current endpoint to iterate over
   * @param nextPage The next page in the API
   * @returns Whether there are more pages or endponts to iterate over
   */
  isFinished(endpoints: Endpoints, currentEndpoint: string, nextPage: string | undefined): boolean {
    return currentEndpoint === endpoints[endpoints.length - 1] && !nextPage
      ? true
      : this.checkGlobalLimit()
  }

  checkGlobalLimit(): boolean {
    return this.limitCount >= this.globalLimit
  }

  /**
   * Get the number of seconds from a date to a unix timestamp.
   * Adding a 25% padding for security.
   * If the unix timestamp is before the date, return 3 minutes for security
   * @param date The date to get the seconds from
   * @param unixTimestamp The unix timestamp to get the seconds from
   * @returns The number of seconds from the date to the unix timestamp
   */
  static secondsUntilTimestamp(
    unixTimestamp: number,
    date: Date = moment().utc().toDate(),
  ): number {
    const timestampedDate: number = moment.utc(date).unix()
    if (timestampedDate > unixTimestamp) {
      return 60 * 3
    }
    return Math.floor((unixTimestamp - timestampedDate) * BaseIterator.timePadding)
  }

  /**
   * Check whether the last record is over the retrospect that we are interested in
   * @param lastRecord The last activity we got
   * @param startTimestamp The timestamp when we started
   * @param maxRetrospect The maximum time we want to crawl
   * @returns Whether we are over the retrospect already
   */
  static isRetrospectOver(lastRecord: any, startTimestamp: number, maxRetrospect: number): boolean {
    return startTimestamp - moment(lastRecord.timestamp).unix() > maxRetrospect
  }

  static async sleep(s) {
    return new Promise((resolve) => {
      setTimeout(resolve, s * 1000)
    })
  }

  /**
   *
   * @param endpoint String with the endpoint representation
   * @returns parsed JSON string
   */
  static decodeEndpoint(endpoint: string): any {
    return JSON.parse(endpoint)
  }

  /**
   * Initialise and return the Superface Client.
   * If we are in test, it will not initialise
   * @returns The initialised client
   */
  static initSuperfaceClient(): SuperfaceClient {
    if (IS_TEST_ENV) {
      return undefined
    }
    return new SuperfaceClient()
  }
}
