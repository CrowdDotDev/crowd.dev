import Layout from '@/modules/layout/components/layout.vue';
import store from '@/modules/layout/layout-store';
import routes from '@/modules/layout/layout-routes';

export default {
  components: {
    'app-layout': Layout,
  },

  store,

  routes,
};
