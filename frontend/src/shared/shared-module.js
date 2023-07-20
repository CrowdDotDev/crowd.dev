import I18n from '@/shared/i18n/i18n.vue';
import StringArrayInput from '@/shared/form/string-array-input.vue';
import AutocompleteOneInput from '@/shared/form/autocomplete-one-input.vue';
import AutocompleteManyInput from '@/shared/form/autocomplete-many-input.vue';
import KeywordsInput from '@/shared/form/keywords-input.vue';
import Avatar from '@/shared/avatar/avatar.vue';
import SquaredAvatar from '@/shared/avatar/squared-avatar.vue';
import Alert from '@/shared/alert/alert.vue';
import Teleport from '@/shared/teleport/teleport.vue';
import Pagination from '@/shared/pagination/pagination.vue';
import PaginationSorter from '@/shared/pagination/pagination-sorter.vue';
import FilterTypeSelectMulti from '@/shared/filter/components/type/filter-type-select-multi.vue';
import InlineSelectInput from '@/shared/form/inline-select-input.vue';
import Dialog from '@/shared/dialog/dialog.vue';
import EmptyStateCta from '@/shared/empty-state/empty-state-cta.vue';
import EmptyState from '@/shared/empty-state/empty-state.vue';
import Platform from '@/shared/platform/platform.vue';
import Drawer from '@/shared/drawer/drawer.vue';
import AppLoader from '@/shared/loading/loader.vue';
import AppPageWrapper from '@/shared/layout/page-wrapper.vue';
import Image from '@/shared/image/image.vue';

/**
 * All shared components are globally registered, so there's no need to import them from other components
 */
export default {
  components: {
    'app-i18n': I18n,
    'app-autocomplete-one-input': AutocompleteOneInput,
    'app-autocomplete-many-input': AutocompleteManyInput,
    'app-string-array-input': StringArrayInput,
    'app-filter-type-select-multi': FilterTypeSelectMulti,
    'app-avatar': Avatar,
    'app-squared-avatar': SquaredAvatar,
    'app-alert': Alert,
    'app-keywords-input': KeywordsInput,
    'app-teleport': Teleport,
    'app-pagination': Pagination,
    'app-pagination-sorter': PaginationSorter,
    'app-inline-select-input': InlineSelectInput,
    'app-dialog': Dialog,
    'app-empty-state-cta': EmptyStateCta,
    'app-empty-state': EmptyState,
    'app-platform': Platform,
    'app-drawer': Drawer,
    'app-loader': AppLoader,
    'app-page-wrapper': AppPageWrapper,
    'app-image': Image,
  },
};
