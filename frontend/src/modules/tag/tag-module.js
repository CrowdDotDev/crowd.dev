import store from '@/modules/tag/tag-store';
import TagAutocompleteInput from '@/modules/tag/components/tag-autocomplete-input.vue';

export default {
  components: {
    'app-tag-autocomplete-input': TagAutocompleteInput,
  },
  store,
};
