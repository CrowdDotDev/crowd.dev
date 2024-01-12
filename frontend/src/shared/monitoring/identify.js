import { useLogRocket } from '@/utils/logRocket';
import config from '@/config';

export default function identify(user) {
  const { identify } = useLogRocket();

  window.analytics.identify(user.id, {
    name: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  });

  identify(user.id, {
    name: user.fullName,
    email: user.email,
  });
}
