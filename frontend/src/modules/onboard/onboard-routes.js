import { buildInitialState, store } from '@/store';
import { PermissionChecker } from '@/modules/user/permission-checker';

const OnboardPage = () => import('@/modules/onboard/pages/onboard-page.vue');
const OnboardBookADemoPage = () => import('@/modules/onboard/pages/onboard-book-a-demo-page.vue');

export default [
  {
    name: 'onboard',
    path: '/onboard',
    component: OnboardPage,
    meta: {
      auth: true,
      title: 'Onboarding',
    },
    beforeEnter: () => {
      const initialState = buildInitialState(true);

      store.replaceState(initialState);
    },
  },
  {
    name: 'onboardDemo',
    path: '/onboard/demo',
    component: OnboardBookADemoPage,
    meta: {
      auth: true,
      title: 'Onboarding',
    },
  },
];
