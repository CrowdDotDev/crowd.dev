import LogRocket from 'logrocket';
import config from '@/config';

export default function identify(user) {
  if (!user) {
    return;
  }
  window.analytics.identify(user.id, {
    name: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  });

  if (config.env === 'production') {
    LogRocket.identify(user.id, {
      name: user.fullName,
      email: user.email,
    });
  }
}
