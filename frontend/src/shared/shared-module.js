import AutocompleteOneInput from '@/shared/form/autocomplete-one-input.vue';
import AutocompleteManyInput from '@/shared/form/autocomplete-many-input.vue';
import KeywordsInput from '@/shared/form/keywords-input.vue';
import Avatar from '@/shared/avatar/avatar.vue';
import Pagination from '@/shared/pagination/pagination.vue';
import InfinitePagination from '@/shared/pagination/infinite-pagination.vue';
import PaginationSorter from '@/shared/pagination/pagination-sorter.vue';
import InlineSelectInput from '@/shared/form/inline-select-input.vue';
import EmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import EmptyState from '@/shared/empty-state/empty-state.vue';
import Drawer from '@/shared/drawer/drawer.vue';
import AppLoader from '@/shared/loading/loader.vue';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import Image from '@/shared/image/image.vue';

/**
 * All shared components are globally registered, so there's no need to import them from other components
 */
export default {
  components: {
    'app-autocomplete-one-input': AutocompleteOneInput,
    'app-autocomplete-many-input': AutocompleteManyInput,
    'app-avatar': Avatar,
    'app-keywords-input': KeywordsInput,
    'app-pagination': Pagination,
    'app-infinite-pagination': InfinitePagination,
    'app-pagination-sorter': PaginationSorter,
    'app-inline-select-input': InlineSelectInput,
    'app-empty-state-cta': EmptyStateCta,
    'app-empty-state': EmptyState,
    'app-drawer': Drawer,
    'app-loader': AppLoader,
    'app-page-wrapper': AppPageWrapper,
    'app-image': Image,
  },
};
