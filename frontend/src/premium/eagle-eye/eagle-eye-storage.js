/**
 * Storage Object
 * [tenantId]: {
 *    [userId]: {
 *      posts: []
 *      storageDate: '',
 *    }
 * }
 */

import moment from 'moment';

export const isStorageUpdating = ({ tenantId, userId }) => {
  const storage = localStorage.getItem('eagleEyeResults');

  if (
    !storage
    || !JSON.parse(storage)?.[tenantId]?.[userId]
  ) {
    return null;
  }

  return !JSON.parse(storage)[tenantId][userId].storageDate;
};

export const shouldFetchNewResults = ({
  tenantId,
  userId,
}) => {
  const storage = localStorage.getItem('eagleEyeResults');
  const currentDay = moment();

  // Fetch new results if it is a new day from the previous stored one,
  // or if storage is not set or if user is not set in storage
  if (
    !storage
    || !JSON.parse(storage)[tenantId]?.[userId]
    || !currentDay.isSame(
      JSON.parse(storage)[tenantId][userId].storageDate,
      'd',
    )
  ) {
    return true;
  }

  return false;
};

// Get posts from local storage
export const getResultsFromStorage = ({
  tenantId,
  userId,
}) => {
  const storage = localStorage.getItem('eagleEyeResults');

  if (!storage) {
    return null;
  }

  return JSON.parse(storage)[tenantId][userId].posts;
};

// Set results in storage for the given tenant and user id
export const setResultsInStorage = ({
  storageDate,
  posts,
  tenantId,
  userId,
}) => {
  const storage = JSON.parse(
    localStorage.getItem('eagleEyeResults') || '{}',
  );
  const payload = {
    posts,
    storageDate,
  };

  // Add/update user posts in tenantId
  if (storage[tenantId]) {
    storage[tenantId][userId] = payload;
  } else {
    storage[tenantId] = {
      [userId]: payload,
    };
  }

  localStorage.setItem(
    'eagleEyeResults',
    JSON.stringify(storage),
  );
};
