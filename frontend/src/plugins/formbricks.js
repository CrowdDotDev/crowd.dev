// eslint-disable-next-line import/no-extraneous-dependencies
import formbricks from '@formbricks/js';
import config from '@/config';

if (typeof window !== 'undefined' && config.formbricks.url) {
  formbricks.init({
    environmentId: config.formbricks.environmentId,
    apiHost: config.formbricks.url,
  });
}

export default formbricks;
