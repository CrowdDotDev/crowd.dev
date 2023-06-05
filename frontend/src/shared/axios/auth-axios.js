import Axios from 'axios';
import { stringify } from 'qs';
import moment from 'moment';
import { AuthToken } from '@/modules/auth/auth-token';
import config from '@/config';
import { getLanguageCode } from '@/i18n';

const authAxios = Axios.create({
  baseURL: config.backendUrl,
  paramsSerializer(params) {
    return stringify(params, {
      arrayFormat: 'brackets',
      filter: (prefix, value) => {
        if (
          moment.isMoment(value)
          || value instanceof Date
        ) {
          return value.toISOString();
        }

        return value;
      },
    });
  },
});

authAxios.interceptors.request.use(
  async (options) => {
    if (['delete', 'put'].includes(options.method)) {
      const encodedUrl = (
        options
          .url.replace(
            /\/[^/]*$/,
            `/${encodeURIComponent(options.url.split('/').at(-1))}`,
          )
      );
      Object.assign(options, { url: encodedUrl });
    }
    const token = options.headers?.Authorization || AuthToken.get();

    const setOptions = { ...options };

    if (token) {
      setOptions.headers.Authorization = `Bearer ${token}`;
    }

    setOptions.headers['Accept-Language'] = getLanguageCode();

    return setOptions;
  },
  (error) => {
    console.error('Request error: ', error);
    return Promise.reject(error);
  },
);

export default authAxios;
