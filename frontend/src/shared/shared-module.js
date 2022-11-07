import I18n from '@/shared/i18n/i18n.vue'
import I18nFlags from '@/shared/i18n/i18n-flags.vue'
import I18nSelect from '@/shared/i18n/i18n-select.vue'
import ImageUpload from '@/shared/form/image-upload.vue'
import FileUpload from '@/shared/form/file-upload.vue'
import ImageCarousel from '@/shared/view/image-carousel.vue'
import ViewItemText from '@/shared/view/view-item-text.vue'
import ViewItemImage from '@/shared/view/view-item-image.vue'
import ViewItemFile from '@/shared/view/view-item-file.vue'
import ViewItemCustom from '@/shared/view/view-item-custom.vue'
import ListItemImage from '@/shared/list/list-item-image.vue'
import ListItemFile from '@/shared/list/list-item-file.vue'
import NumberRangeInput from '@/shared/form/number-range-input.vue'
import AutocompleteOneInput from '@/shared/form/autocomplete-one-input.vue'
import AutocompleteManyInput from '@/shared/form/autocomplete-many-input.vue'
import KeywordsInput from '@/shared/form/keywords-input.vue'
import ViewItemRelationToOne from '@/shared/view/view-item-relation-to-one.vue'
import ViewItemRelationToMany from '@/shared/view/view-item-relation-to-many.vue'
import ListItemRelationToOne from '@/shared/list/list-item-relation-to-one.vue'
import ListItemRelationToMany from '@/shared/list/list-item-relation-to-many.vue'
import FilterPreview from '@/shared/filter/filter-preview.vue'
import FilterDropdown from '@/shared/filter/components/filter-dropdown.vue'
import FilterSearch from '@/shared/filter/components/type/filter-type-search'
import FilterList from '@/shared/filter/components/filter-list.vue'
import FilterTypeSelect from '@/shared/filter/components/type/filter-type-select'
import FilterTypeSelectMulti from '@/shared/filter/components/type/filter-type-select-multi'
import FilterTypeSelectGroup from '@/shared/filter/components/type/filter-type-select-group'
import FilterTypeSelectAsync from '@/shared/filter/components/type/filter-type-select-async'
import FilterTypeKeywords from '@/shared/filter/components/type/filter-type-keywords'
import FilterTypeBoolean from '@/shared/filter/components/type/filter-type-boolean'
import FilterTypeNumber from '@/shared/filter/components/type/filter-type-number'
import FilterTypeString from '@/shared/filter/components/type/filter-type-string'
import FilterTypeDate from '@/shared/filter/components/type/filter-type-date'
import FilterToggle from '@/shared/filter/filter-toggle.vue'
import Avatar from '@/shared/avatar/avatar.vue'
import SquaredAvatar from '@/shared/avatar/squared-avatar.vue'
import Alert from '@/shared/alert/alert.vue'
import Teleport from '@/shared/teleport/teleport.vue'
import Popover from '@/shared/popover/popover.vue'
import Pagination from '@/shared/pagination/pagination.vue'
import PaginationSorter from '@/shared/pagination/pagination-sorter.vue'
import InlineSelectInput from '@/shared/form/inline-select-input'
import Dialog from '@/shared/dialog/dialog'
import EmptyStateCta from '@/shared/empty-state/empty-state-cta'
import EmptyState from '@/shared/empty-state/empty-state'
import Platform from '@/shared/platform/platform'
import Drawer from '@/shared/drawer/drawer'

/**
 * All shared components are globally registered, so there's no need to import them from other components
 */
export default {
  components: {
    'app-i18n': I18n,
    'app-i18n-flags': I18nFlags,
    'app-i18n-select': I18nSelect,
    'app-image-upload': ImageUpload,
    'app-file-upload': FileUpload,
    'app-image-carousel': ImageCarousel,
    'app-view-item-text': ViewItemText,
    'app-view-item-image': ViewItemImage,
    'app-view-item-file': ViewItemFile,
    'app-view-item-custom': ViewItemCustom,
    'app-list-item-image': ListItemImage,
    'app-list-item-file': ListItemFile,
    'app-number-range-input': NumberRangeInput,
    'app-autocomplete-one-input': AutocompleteOneInput,
    'app-autocomplete-many-input': AutocompleteManyInput,
    'app-view-item-relation-to-one': ViewItemRelationToOne,
    'app-view-item-relation-to-many':
      ViewItemRelationToMany,
    'app-list-item-relation-to-one': ListItemRelationToOne,
    'app-list-item-relation-to-many':
      ListItemRelationToMany,
    'app-filter-preview': FilterPreview,
    'app-filter-list': FilterList,
    'app-filter-type-select': FilterTypeSelect,
    'app-filter-type-select-multi': FilterTypeSelectMulti,
    'app-filter-type-select-group': FilterTypeSelectGroup,
    'app-filter-type-keywords': FilterTypeKeywords,
    'app-filter-type-select-async': FilterTypeSelectAsync,
    'app-filter-type-boolean': FilterTypeBoolean,
    'app-filter-type-number': FilterTypeNumber,
    'app-filter-type-string': FilterTypeString,
    'app-filter-type-date': FilterTypeDate,
    'app-filter-search': FilterSearch,
    'app-filter-dropdown': FilterDropdown,
    'app-filter-toggle': FilterToggle,
    'app-avatar': Avatar,
    'app-squared-avatar': SquaredAvatar,
    'app-alert': Alert,
    'app-keywords-input': KeywordsInput,
    'app-teleport': Teleport,
    'app-popover': Popover,
    'app-pagination': Pagination,
    'app-pagination-sorter': PaginationSorter,
    'app-inline-select-input': InlineSelectInput,
    'app-dialog': Dialog,
    'app-empty-state-cta': EmptyStateCta,
    'app-empty-state': EmptyState,
    'app-platform': Platform,
    'app-drawer': Drawer
  }
}
