<template>
  <div class="flex items-end justify-between mb-6 h-8">
    <div class="tabs flex-grow " :class="{ 'is-shrink': hasChanged }">
      <el-tabs v-if="views.length > 0" v-model="selectedTab" @tab-change="onTabChange($event)">
        <el-tab-pane
          :label="props.config.defaultView.name"
          name=""
        />
        <el-tab-pane
          v-for="view of views"
          :key="view.name"
          :label="view.name"
          :name="view.id"
        />
      </el-tabs>
    </div>
    <div class="border-b-2 border-[#e4e7ed] flex-grow flex justify-end -mb-px pb-1">
      <el-button v-if="hasChanged" class="btn btn-brand btn-brand--transparent btn--sm !leading-5 !h-8 mr-2" @click="reset()">
        Reset view
      </el-button>
      <el-dropdown placement="bottom-end">
        <el-button v-if="hasChanged" class="btn btn-brand btn-brand--transparent btn--sm !h-8 !leading-5 mr-2">
          Save as...
        </el-button>
        <template #dropdown>
          <el-dropdown-item v-if="selectedTab.length > 0 && selectedTab !== props.config.defaultView.id">
            <div class="w-40" @click="update()">
              <i class="ri-loop-left-line text-gray-400 text-base mr-2" />Update view
            </div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div class="w-40">
              <i class="ri-add-line text-gray-400 text-base mr-2" />Create new view
            </div>
          </el-dropdown-item>
        </template>
      </el-dropdown>

      <el-tooltip content="Add view" placement="top">
        <el-button class="btn btn-brand btn--transparent btn--icon--sm inset-y-0 !border-0 mr-2" @click="isFormOpen = true">
          <i class="ri-add-line text-lg text-gray-400 h-5 flex items-center" />
        </el-button>
      </el-tooltip>
      <el-popover v-if="views.length > 0" trigger="click" placement="bottom-end" popper-class="!p-0" width="320px">
        <template #reference>
          <el-button class="btn btn-brand btn--transparent btn--icon--sm inset-y-0 !border-0">
            <i class="ri-list-settings-line text-lg text-gray-400 h-5 flex items-center" />
          </el-button>
        </template>
        <cr-saved-views-management
          v-model:views="views"
          :config="props.config"
          @edit="edit($event)"
          @duplicate="duplicate($event)"
          @reload="getViews()"
        />
      </el-popover>
    </div>
  </div>
  <cr-saved-views-form
    v-model="isFormOpen"
    :config="props.config"
    :filters="props.filters"
    :placement="props.placement"
    :view="editView"
    @update:model-value="editView = null"
    @reload="getViews()"
  />
</template>

<script setup lang="ts">
import {
  computed, getCurrentInstance,
  onMounted, ref, watch,
} from 'vue';
import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SavedView, SavedViewCreate, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { isEqual } from 'lodash';
import CrSavedViewsForm from '@/shared/modules/saved-views/components/forms/SavedViewForm.vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import CrSavedViewsManagement from '@/shared/modules/saved-views/components/SavedViewManagement.vue';
import { SavedViewsService } from '@/shared/modules/saved-views/services/saved-views.service';

const props = defineProps<{
  modelValue: Filter,
  config: SavedViewsConfig,
  filters: Record<string, FilterConfig>,
  placement: string,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: Filter): any}>();

const isFormOpen = ref<boolean>(false);

const filters = computed<Filter>({
  get() {
    return props.modelValue;
  },
  set(value: Filter) {
    emit('update:modelValue', value);
  },
});

const selectedTab = ref<string>('');

const getView = (id: string): SavedView => {
  if (id.length > 0) {
    const view = views.value.find((v) => v.id === id);
    if (view) {
      return view;
    }
  }
  return props.config.defaultView;
};

const currentView = computed<SavedView>(() => getView(selectedTab.value));

const compareFilterToCurrentValues = (filter: Filter): boolean => {
  const compareFilter = {
    ...filter,
  };
  const currentFilter = {
    ...props.modelValue,
  };

  return isEqual(compareFilter, currentFilter);
};

const hasChanged = computed<boolean>(() => {
  const viewFilter = currentView.value.config;
  return !compareFilterToCurrentValues(viewFilter);
});

const onTabChange = (id: string) => {
  const { config } = getView(id);
  if (config) {
    filters.value = {
      ...config,
    };
  }
};

// Reset to current view
const reset = () => {
  filters.value = {
    ...currentView.value.config,
  };
};

// Update current view
const update = () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Update shared view',
    message:
        'This view is shared with all workspace users, any changes will reflected in each user account.',
    icon: 'ri-loop-left-line',
    confirmButtonText: 'Update shared view',
    showCancelButton: true,
    cancelButtonText: 'Cancel',
  } as any).then(() => {
  });
};

// Change tab if filters match
watch(() => props.modelValue, (filter: Filter) => {
  if (compareFilterToCurrentValues(props.config.defaultView.config)) {
    selectedTab.value = '';
    return;
  }
  const matchingView = views.value.find((view) => compareFilterToCurrentValues(view.config));
  if (matchingView) {
    selectedTab.value = matchingView.id;
  }
}, { deep: true });

// View management
const views = ref<SavedView[]>([]);

const getViews = () => {
  SavedViewsService.query({
    filter: {
      placement: [props.placement],
    },
  })
    .then((res: SavedView[]) => {
      views.value = [];
      setTimeout(() => {
        views.value = [...res];
      }, 0);
    })
    .catch(() => {
      views.value = [];
    });
};

const editView = ref<SavedView | SavedViewCreate | null>(null);
const edit = (view: SavedView) => {
  editView.value = view;
  isFormOpen.value = true;
};
const duplicate = (view: SavedView) => {
  editView.value = {
    ...view,
    id: undefined,
    name: `${view.name} (1)`,
  };
  isFormOpen.value = true;
};

onMounted(() => {
  getViews();
});
</script>

<script lang="ts">
export default {
  name: 'CrSavedViews',
};
</script>

<style lang="scss" scoped>
.tabs {
  width: calc(100% - 72px);

  &.is-shrink{
    width: calc(100% - 262px);
  }
}
</style>
