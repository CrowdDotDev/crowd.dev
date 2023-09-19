import LogRocket from 'logrocket';
import config from '@/config';
import { FEATURE_FLAGS } from '@/utils/featureFlag';
import { User } from '@/modules/user/types/User';

const APP_ID = 'nm6fil/crowddev';

const isLogRocketEnabled: () => void = () => config.env === 'production' && this.unleash.isEnabled(FEATURE_FLAGS.logRocket);

const init = () => {
  if (isLogRocketEnabled()) {
    LogRocket.init(APP_ID);
  }
};

const captureException = (error: Error) => {
  if (isLogRocketEnabled()) {
    LogRocket.captureException(error);
  }
};

const identify = (user: User) => {
  if (isLogRocketEnabled()) {
    LogRocket.identify(user.id, {
      name: user.fullName,
      email: user.email,
    });
  }
};

export const useLogRocket = () => ({
  isLogRocketEnabled,
  init,
  captureException,
  identify,
});
