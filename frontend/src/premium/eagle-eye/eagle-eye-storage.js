/**
 * Storage Object
 * [tenantId]: {
 *    [userId]: {
 *      posts: []
 *      storageDate: ''
 *    }
 * }
 */

import moment from 'moment'

export const shouldFetchNewResults = ({
  tenantId,
  userId
}) => {
  const storage = localStorage.getItem('eagleEyeResults')
  const currentDay = moment()

  // Fetch new results if it is a new day from the previous stored one,
  // or if storage is not set or if user is not set in storage
  const userNotStore =
    !JSON.parse(storage)[tenantId]?.[userId]
  const isNotToday = !currentDay.isSame(
    JSON.parse(storage)[tenantId][userId].storageDate,
    'd'
  )

  return !storage || userNotStore || isNotToday
}

// Get posts from local storage
export const getResultsFromStorage = ({
  tenantId,
  userId
}) => {
  const storage = localStorage.getItem('eagleEyeResults')

  if (!storage) {
    return []
  }

  return JSON.parse(storage)[tenantId][userId].posts
}

// Set results in storage for the given tenant and user id
export const setResultsInStorage = ({
  posts,
  tenantId,
  userId
}) => {
  const storage = JSON.parse(
    localStorage.getItem('eagleEyeResults') || '{}'
  )
  const payload = {
    posts,
    storageDate: moment()
  }

  // Add/update user posts in tenantId
  if (storage[tenantId]) {
    storage[tenantId][userId] = payload
  } else {
    // Add/update user posts in new tenantId
    storage[tenantId] = {
      [userId]: payload
    }
  }

  localStorage.setItem(
    'eagleEyeResults',
    JSON.stringify(storage)
  )
}
