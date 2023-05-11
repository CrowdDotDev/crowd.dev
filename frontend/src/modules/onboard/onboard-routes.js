import { buildInitialState, store } from '@/store';

const OnboardPage = () => import('@/modules/onboard/pages/onboard-page.vue');

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
];
