import dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

export const KUBE_MODE: boolean = process.env.KUBE_MODE !== undefined;

if (!KUBE_MODE) {
  // If we are in development, we need to get the environment from the backend root folder
  if (process.env.NODE_ENV === 'development') {
    dotenv.config({ path: './../../backend/.env' });
  }
}

export const SEARCH_ENGINE_HOST = KUBE_MODE
  ? process.env.CROWD_SEARCH_ENGINE_HOST
  : process.env.SEARCH_ENGINE_HOST;

export const SEARCH_ENGINE_API_KEY = KUBE_MODE
  ? process.env.CROWD_SEARCH_ENGINE_API_KEY
  : process.env.SEARCH_ENGINE_API_KEY;

export const SEARCH_ENGINE_CONVERSATIONS_INDEX = KUBE_MODE
  ? process.env.CROWD_SEARCH_ENGINE_CONVERSATIONS_INDEX
  : process.env.CONVERSATIONS_INDEX;

export const SEARCH_ENGINE_SETTINGS_INDEX = KUBE_MODE
  ? process.env.CROWD_SEARCH_ENGINE_SETTINGS_INDEX
  : process.env.SETTINGS_INDEX;

export const APP_DOMAIN = KUBE_MODE
  ? process.env.CROWD_NETLIFY_SITE_DOMAIN
  : process.env.APP_DOMAIN;
