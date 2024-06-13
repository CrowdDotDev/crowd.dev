import Axios from 'axios';
import { stringify } from 'qs';
import moment from 'moment';
import config from '@/config';
import { getLanguageCode } from '@/i18n';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import { AuthService } from '@/modules/auth/services/auth.service';

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
    const lsSegmentsStore = useLfSegmentsStore();
    const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
    const setOptions = { ...options };

    const hasSegmentsQueryParams = options.params?.segments?.length;
    const hasSegmentsBody = options.data?.segments?.length;

    const includeSegmentsInRequest = (selectedProjectGroup.value
      || hasSegmentsBody
      || hasSegmentsQueryParams
    ) && !options.data?.excludeSegments && !options.params?.excludeSegments;

    // Add segments to requests
    if (includeSegmentsInRequest) {
      let segments;
      if (hasSegmentsBody) {
        segments = options.data.segments;
      } else if (hasSegmentsQueryParams) {
        segments = options.params.segments;
        // If neither body or query params have segments
        // Use selected project group segment ids
      } else if (selectedProjectGroup.value.projects.length) {
        segments = getSegmentsFromProjectGroup(selectedProjectGroup.value, options);
      }

      if (options.method === 'get') {
        setOptions.params = {
          ...setOptions.params || {},
          segments,
        };
      } else if (options.method === 'patch') {
        setOptions.params = {
          ...setOptions.params || {},
          segments,
        };
        setOptions.data = setOptions.data || {};
      } else {
        setOptions.data = {
          ...setOptions.data || {},
          segments,
        };
      }
    }

    if (setOptions.data?.addDataAsArray) {
      setOptions.data = setOptions.data.data;

      delete setOptions.data.data;
      delete setOptions.data.addDataAsArray;
    }

    // Remove flag from request
    if (setOptions.data?.excludeSegments) {
      delete setOptions.data.excludeSegments;
    }

    if (setOptions.params?.excludeSegments) {
      delete setOptions.params.excludeSegments;
    }

    if (['delete', 'put'].includes(setOptions.method)) {
      const encodedUrl = (
        setOptions
          .url.replace(
            /\/[^/]*$/,
            `/${encodeURIComponent(setOptions.url.split('/').at(-1))}`,
          )
      );
      Object.assign(setOptions, { url: encodedUrl });
    }

    const token = setOptions.headers?.Authorization || AuthService.getToken();

    if (token) {
      setOptions.headers.Authorization = `Bearer ${token}`;
    }

    if (localStorage.getItem('profile-sql') === '1') {
      setOptions.headers['x-profile-sql'] = 'true';
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
