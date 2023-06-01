import Axios from 'axios';
import { stringify } from 'qs';
import moment from 'moment';
import { AuthToken } from '@/modules/auth/auth-token';
import config from '@/config';
import { getLanguageCode } from '@/i18n';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

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

    // TODO: Improve this logic

    // Add segments to requests
    if ((selectedProjectGroup.value
      || options.data?.segments?.length || options.params?.segments?.length) && !options.data?.excludeSegments
        && !options.params?.excludeSegments) {
      let segments;

      if (options.data?.segments?.length) {
        segments = options.data.segments;
      } else if (options.params?.segments?.length) {
        segments = options.params.segments;
      } else if (selectedProjectGroup.value.projects.length) {
        segments = selectedProjectGroup.value.projects.reduce((acc, project) => {
          project.subprojects.forEach((subproject) => {
            acc.push(subproject.id);
          });

          return acc;
        }, []);
      }

      if (options.method === 'get') {
        setOptions.params = {
          ...setOptions.params || {},
          segments,
        };
      } else {
        setOptions.data = {
          ...setOptions.data || {},
          segments,
        };
      }
    }

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

    const token = setOptions.headers?.Authorization || AuthToken.get();

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
