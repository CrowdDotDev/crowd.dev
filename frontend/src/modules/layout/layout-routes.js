import ErrorPage from '@/modules/layout/pages/error-page.vue';

export default [
  {
    name: 'error403',
    path: '/403',
    component: ErrorPage,
    props: {
      code: 403,
      title: 'Restricted access',
      subtitle:
        'Sorry, you don’t have permissions to access this page.',
    },
  },
  {
    name: 'error404',
    path: '/404',
    component: ErrorPage,
    props: {
      code: 404,
      title: 'Page not found',
      subtitle:
        'Sorry, the page you are looking for doesn’t exist or was removed.',
    },
  },
  {
    name: 'error500',
    path: '/500',
    component: ErrorPage,
    props: {
      code: 500,
      title: 'Oops, something went wrong',
      subtitle:
        'Please try to reload the page. If the problem remains, reach out to us.',
    },
  },
];
