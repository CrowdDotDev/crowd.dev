import tagFormStore from '@/modules/tag/tag-form-store';
import tagDestroyStore from '@/modules/tag/tag-destroy-store';

export default {
  namespaced: true,

  modules: {
    destroy: tagDestroyStore,
    form: tagFormStore,
  },
};
