// eslint-disable-next-line import/no-extraneous-dependencies
import formbricks from '@formbricks/js';
import config from '@/config';

export const setupFormbricks = (currentUser) => {
  if (typeof window !== 'undefined' && config.formbricks.url && currentUser) {
    formbricks.init({
      environmentId: config.formbricks.environmentId,
      apiHost: config.formbricks.url,
      userId: currentUser.id,
    });
    if (currentUser.email) {
      formbricks.setEmail(currentUser.email);
    }
    if (currentUser.fullName) {
      formbricks.setAttribute('name', currentUser.fullName);
    }
    if (currentUser.createdAt) {
      formbricks.setAttribute('registrationDate', currentUser.createdAt);
    }
    const timestampSignup = new Date(currentUser.createdAt).getTime();
    const timeStamp4WeeksAgo = new Date().getTime() - 4 * 7 * 24 * 60 * 60 * 1000;
    const timeStamp2023 = new Date('2023-01-01').getTime();

    if (
      timestampSignup >= timeStamp2023
      && timestampSignup <= timeStamp4WeeksAgo
      && formbricks
    ) {
      formbricks.track('pmfSurveyOpen');
    }
  }
};

export default formbricks;
