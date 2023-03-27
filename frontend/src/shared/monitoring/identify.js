import LogRocket from 'logrocket';
import config from '@/config';

export default function identify(user) {
  window.analytics.identify(user.id, {
    name: user.fullName,
    email: user.email,
  });

  if (config.env === 'production') {
    LogRocket.identify(user.id, {
      name: user.fullName,
      email: user.email,
    });
  }
}
